sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/Sorter",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterOperator",
      "sap/ui/model/json/JSONModel",
      "sap/ui/model/odata/v2/ODataModel",
      "sap/ui/export/Spreadsheet",
      "sap/m/MessageToast",
      "sap/m/MessageBox",
      "sap/m/SearchField",
      "sap/m/Button",
      "sap/m/Dialog",
      "pgdc0010/sheetjs/jszip",
      "pgdc0010/sheetjs/xlsx.full.min"
    ],
    function(BaseController, Sorter, Filter, FilterOperator, JSONModel, ODataModel, Spreadsheet, MessageToast, MessageBox, SearchField, Button, Dialog) {
      "use strict";
  
      return BaseController.extend("pgdc0010.controller.App", {
        onInit: function() {
          
        },

        /**
         * custom model list 생성
         * @param {*} _oDataList - Model List를 담을 전역변수
         * @param {*} oView - this.getView()
         * @param {*} oModelName - oData Controll을 위한 ModelName
         * @param {*} oModel - oData Controll을 위한 Model
         * @param {*} oEntitySet - oData Controll을 위한 EntitySet
         * @param {*} vModelDiv - Model 생성구분여부
         * @returns 
         */
        _setCustomModel : function(_oDataList, oView, oModelName, oModel, oEntitySet, vModelDiv){
            _oDataList[oModelName] = {
                "oModelName": oModelName,
                "oModel": oModel,
                "oEntitySet": oEntitySet
          };

          switch(vModelDiv){
            case "ODataModel":
                return this._createODataModel(oView, oModel, oModelName);
                break;	
            case "JSONModel":
                return this._createJSONModel(oView, oModelName);
                break;	    
            case "null":
                return null;
                break;	
            }
        },

        /**
         * custom json model 생성
         * @param {*} oView - this.getView()
         * @param {*} oModelName  - oData Controll을 위한 ModelName
         * @returns 
         */
        _createJSONModel : function(oView, oModelName){
            oView.setModel(new JSONModel(), oModelName);
            return oView.getModel(oModelName);
        },
        
        /**
         * custom oModel model 생성
         */
        _createODataModel : function(oView, oModel, oModelName){
            oView.setModel(new ODataModel(oModel), oModelName);
            return oView.getModel(oModelName);
        },

        /**
         * 삭제 - 전치리 없음
         */
        _getODataDelete: function(oModel, readContext){
			var deferred = $.Deferred();
			
            var odataModel = new ODataModel(oModel.oModel);

			odataModel.remove(readContext,{
				success : function(oReturn){
			    	deferred.resolve(oReturn);
				},
				error: function(oError) {
			    	deferred.reject(oError);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
			
			return deferred.promise();
		},

        /**
         * 생성 - 전치리 없음
         * @param {*} oModel 
         * @param {*} readContext 
         * @param {*} oData 
         * @returns 
         */
        _getODataCreate : function(oModel, readContext, oData){
			var deferred = $.Deferred();
			
            var odataModel = new ODataModel(oModel.oModel);

			odataModel.create(readContext, oData,{
				success : function(oReturn){
					var aResult = oReturn.results;
			    	deferred.resolve(aResult);
				},
				error: function(oError) {
                    var aResult = "E";
			    	deferred.resolve(aResult);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
			
			return deferred.promise();
		},

        /**
         * 수정 - 전치리 없음
         * @param {*} oModel 
         * @param {*} readContext 
         * @param {*} oData 
         * @returns 
         */
        _getODataUpdate : function(oModel, readContext, oData){
			var deferred = $.Deferred();
			
            var odataModel = new ODataModel(oModel.oModel);

			odataModel.update(readContext, oData,{
				success : function(oReturn){
					var aResult = "S";
			    	deferred.resolve(aResult);
				},
				error: function(oError) {
                    var aResult = "E";
			    	deferred.resolve(aResult);
					try{
						var oResponseTextData = JSON.parse(oError.responseText);
						MessageToast.show(oResponseTextData.error.message.value);
					}catch(e){
						MessageToast.show(oError.message + "_" + oError.statusCode);
					}
				}
			});
			
			return deferred.promise();
		},
          
        /**
         * _oDataList를 활용한 oData Read
         * @param {*} oModel 
         * @param {*} aFilter 
         * @param {*} aParameters 
         * @param {*} aSort 
         * @returns 
         */
        _getODataModelRead : function(oModel, aFilter, aParameters, aSort){
            var deferred = $.Deferred();
            var odataModel = new ODataModel(oModel.oModel),
                self = this;
            var param = {
                ReadContext : oModel.oEntitySet || "",
                Parameters : aParameters || null,
                Filter : aFilter || [],
                Sorter : aSort || []
            };
            odataModel.read(param.ReadContext,{
                urlParameters: param.Parameters,
                filters : param.Filter,
                sorters : param.Sorter,
                success : function(oReturn){
                    var aResult = oReturn.results;
                    
                    if(oModel.oModelName) {
                        self[oModel.oModelName] = aResult;
                    }
                    
                    deferred.resolve(aResult);
                },
                error: function(oError) {
                    deferred.reject(oError);
                    if(oError.responseText){
                        var oResponseTextData = JSON.parse(oError.responseText);
                        MessageToast.show(oResponseTextData.error.message.value);
                    }else{
                        MessageToast.show(oError.statusText);	
                    }
                }
            });
          
          return deferred.promise();
        },

        /**
         * 기본 oData Read
         * @param {*} sModelName 
         * @param {*} oModel 
         * @param {*} readContext 
         * @param {*} aFilter 
         * @param {*} oParameters 
         * @returns 
         */
        _getODataRead : function(sModelName, oModel, readContext, aFilter, oParameters){
            var deferred = $.Deferred();
            var odataModel = new ODataModel(oModel),
                self = this;
            var param = {
                ReadContext : readContext || "",
                Parameters : oParameters || null,
                Filter : aFilter || []
            };
            odataModel.read(param.ReadContext,{
                urlParameters: param.Parameters,
                filters : [param.Filter],
                success : function(oReturn){
                    var aResult = oReturn.results;
                    
                    if(sModelName) {
                        self[sModelName] = aResult;
                    }
                    
                    deferred.resolve(aResult);
                },
                error: function(oError) {
                    deferred.reject(oError);
                    if(oError.responseText){
                        var oResponseTextData = JSON.parse(oError.responseText);
                        MessageToast.show(oResponseTextData.error.message.value);
                    }else{
                        MessageToast.show(oError.statusText);	
                    }
                }
            });
            
            return deferred.promise();
        },

        /**
         * 검색조건 가져오기
         * @returns 
         */
        _getSearchFilter : function(){
            var aFilter = [];
            var oView = this.getView(),
                iFilterBar = oView.byId("iFilterBar"),
                aFilterItems = iFilterBar.getFilterGroupItems();
                
            aFilterItems.forEach(function(item){
                var vFieldName = item.getName(),
                    oControl = item.getControl(),
                    oFilter = this._getControlValue(oControl, vFieldName);
                if(oFilter){
                    aFilter.push(oFilter);
                }
            }.bind(this));
            
            return aFilter;
        },
        /**
         * 검색조건 유형별 처리
         * @param {*} oControl 
         * @param {*} vFieldName 
         * @returns 
         */
        _getControlValue : function(oControl, vFieldName){
            var oFilter = null, vValue = null, vValue2 = null;
            
            if(oControl instanceof sap.m.MultiComboBox){
                vValue = oControl.getSelectedKeys();
                if(vValue.length){
                    oFilter = new Filter({
                        filters : vValue.map(function(item){
                            return new Filter(vFieldName, "EQ", item);
                        }),
                        and : false
                    });
                }
            }else if(oControl instanceof sap.m.MultiInput){
                vValue = oControl.getTokens();
                if(vValue.length){
                    oFilter = new Filter({
                        filters : vValue.map(function(oToken){
                            var sCode = oToken.getKey();
                            if(vFieldName === "SOLD_TO_PARTY"){
                                sCode = this._conversionCode(sCode);
                            }
                            return new Filter(vFieldName, "EQ", sCode);
                        }.bind(this)),
                        and : false
                    });
                }
            }else if(oControl instanceof sap.m.Input){
                vValue = oControl.getValue().trimLeft();
                if(vValue){
                    oFilter = new Filter(vFieldName, "EQ", vValue);
                }
            }else if(oControl instanceof sap.m.DateRangeSelection){
                if(oControl.getDateValue()) {
                    vValue = this._getODataDateValue(oControl.getDateValue());
                    vValue2 = this._getODataDateValue(oControl.getSecondDateValue(), "to") || vValue;
                    oFilter = new Filter(vFieldName, "BT", vValue, vValue2);
                }
            }else if(oControl instanceof sap.m.ComboBox){
                vValue = oControl.getSelectedKey();
                if(vValue){
                    oFilter = new Filter(vFieldName, "EQ", vValue);
                }
            }

            return oFilter;
        },

        /**
         * 테이블 체크값 가져오기
         * @param {*} oModel 
         * @param {*} oTable 
         * @returns 
         */
        _getSelectedRow : function(oModel, oTable) {
            var aSelectedRows = [],
                aSelectedIndex = oTable.getSelectedIndices();
            
            aSelectedRows = aSelectedIndex.map(function(item, idx) {
                var sSelectedPath = oTable.getContextByIndex(item).getPath(),
                    oSelectedRow = oModel.getProperty(sSelectedPath);
                    oSelectedRow.rowIndex = item;
                return oSelectedRow;
            });
            
            return aSelectedRows;
        },

        /**
         * value help Search Dialog
         * @param {*} pramObj 
         * @param {*} aFilter 
         * @param {*} fnPressButton 
         */
        _openSearchDialog: function (pramObj, aFilter, fnPressButton) {
            var dialog = new sap.m.Dialog({
                draggable : true,
                resizable : true,
                title: pramObj.title, 
                contentHeight : "500px",
                content: [
                    new sap.m.SearchField({
                        liveChange : function(oEvt){
                            var aFilters = [],
                                sQuery = oEvt.getSource().getValue(),
                                oList = dialog.getContent()[1];
                            var oFilters = null;
                            if (sQuery && sQuery.length > 0) {
                                if(pramObj.DescFilterField){
                                    oFilters = new Filter({
                                        filters : [
                                            new Filter(pramObj.TitleFilterField, FilterOperator.Contains, sQuery),
                                            new Filter(pramObj.DescFilterField, FilterOperator.Contains, sQuery)
                                        ]
                                    });
                                }else{
                                    oFilters = new Filter(pramObj.TitleFilterField, FilterOperator.Contains, sQuery);
                                }
                                aFilters.push(oFilters);
                            }
                
                            // update list binding
                            var binding = oList.getBinding("items");
                            binding.filter(aFilters);
                        }
                    }),
                    new sap.m.List({
                        items : {
                            path : pramObj.EntitySet,
                            parameters: pramObj.parameters || {},
                            filters : aFilter,
                            template : new sap.m.StandardListItem({
                                type : "Navigation",
                                title : pramObj.TitleProperty,
                                description : pramObj.DescriptionProperty,
                                press : function(e) {
                                    fnPressButton(e);
                                    dialog.close();
                                }
                            })
                        }
                    })
                ],
                endButton: new sap.m.Button({
                    text: "{i18n>dialogCloseButtonText}",
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function() {
                    dialog.destroy();
                }
            });
            
            this.getView().addDependent(dialog);
            dialog.open();
        },

        /**
         * 코드값 자릿수 리턴
         */
        _conversionCode : function(sCode,vInt){
			var sConversionCode = sCode,
				iCodeLen = sCode.length;
			
			if(iCodeLen < vInt){
				for(var i = 0, len = vInt - iCodeLen; i < len; i++){
					sConversionCode = "0" + sConversionCode;
				}
			}else{
				sConversionCode = sCode.slice(0, vInt);
			}
			
			return sConversionCode;
		},

        /**
         * 메시지박스1
         * @param {*} sMessage 
         * @param {*} fnCallback 
         * @returns 
         */
        _showMessage: function(sMessage, fnCallback) {
            MessageBox.show(sMessage, {
                icon: MessageBox.Icon.INFORMATION,
                title: "알림",
                actions: [MessageBox.Action.OK],
                onClose: fnCallback
            });
        },

        /**
         * 메시지박스2
         * @param {*} sMessage 
         * @param {*} fnCallback 
         */
        _showConfirm: function(sMessage, fnCallback) {
            MessageBox.show(sMessage, {
                icon: MessageBox.Icon.QUESTION,
                title: "확인",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        fnCallback(true);
                    } else if (oAction === MessageBox.Action.NO) {
                        fnCallback(false);
                    }
                }
            });
        },

        /**
         * 조회시 value help 값 넣기
         * @param {*} tModel target Model
         * @param {*} sModel valueHelp Model
         * @param {*} tCode target code 
         * @param {*} sCode valueHelp code
         * @param {*} tName target name
         * @param {*} sName valueHelp name
         * @returns 
         */
        _setValueHelpName : function(tModel, sModel, tCode, sCode, tName, sName){

            for (const oModel of tModel) {
                for (const oValueHelp of sModel) {
                    if (oModel[tCode] === oValueHelp[sCode]) {
                        oModel[tName] = oValueHelp[sName];
                        break;
                    }
                }
            }
            return tModel;
        }
        
      });
    }
  );
  