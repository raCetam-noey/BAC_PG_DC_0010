sap.ui.define([
    "pgdc0010/controller/ExcelBaseController",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "pgdc0010/util/Constants",
    "sap/ushell/services/UserInfo" // UserInfo 서비스 추가
],
    function (Controller, Spreadsheet, MessageToast, MessageBox, Constants, UserInfo) {
        "use strict";
        var _vFlg = true;
        var _vCnt;
        var _oModelMain;
        var _oTextModel;
        var _oDataList = {};
        var _oLayout;
        var _oTable;
        var _oViewTableModel;
        var _i18n;

        return Controller.extend("pgdc0010.controller.ExcelUpload", {
            _oMappedView: {},
            onInit: function () {
                var oView = this.getView();
                this._oMappedView = new sap.ui.xmlview(Constants.UploadedViewID,Constants.UploadedFSItemMappingView,this);
                this.byId(Constants.MainPage).addContent(this._oMappedView);
                this.setInitPage(oView);
                // this._getUserInfo().then(this._checkUserDraftData.bind(this)); // 드래프트 데이터 확인
            },
            onDownloadSelectedButton: function () {
                var oUploadSet = this.byId("UploadSet");
    
                oUploadSet.getItems().forEach(function (oItem) {
                    if (oItem.getListItem().getSelected()) {
                        oItem.download(true);
                    }
                });
            },

            setInitPage: function (oView) {
                var self = this;
                _i18n = this.getOwnerComponent().getModel('i18n').getResourceBundle();
                // _oTable = oView.byId(Constants).getTable();
                _oTable = sap.ui.getCore().byId('UploadedTable--pgdc0010.fsi.smartTable').getTable();
                _oViewTableModel = this._createJSONModel(oView, "excelUploadEntity");
                _oViewTableModel.setProperty("/", []);
                _oLayout = this._createJSONModel(oView, "oLayout");
                _oLayout.setData({
                    "tableCnt": 0,
                    "uploaderVisible": false,
                    "exportVisible": false,
                    "excelUploadSave": false
                });
                // var filter = [new sap.ui.model.Filter("Language", sap.ui.model.FilterOperator.EQ, '3')]
                _oModelMain = this._setCustomModel(_oDataList, oView, "oMODELMAIN", "/sap/opu/odata/sap/ZSB_GRVCOA/", "/GRVCOA04", "ODataModel");
                // _oTextModel = this._setCustomModel(_oDataList, oView, "oTEXTMODEL", "/sap/opu/odata/sap/ZSB_GRVCOA/", "/CnsldtnFSItemText", "ODataModel");
            },

            /*------------------------------------------------------------------------------------------------------------------------------------------/
            _getUserInfo: function () {
                return new Promise(function (resolve, reject) {
                    if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                        var oUserInfo = sap.ushell.Container.getService("UserInfo");
                        var oUser = oUserInfo.getUser();
                        var userId = oUser.getId();
                        resolve(userId);
                    } else {
                        reject();
                    }
                });
            },

            _checkUserDraftData: function (userId) {
                var self = this;
                var mainModel = this.getView().getModel('oMODELMAIN');
                mainModel.setSizeLimit(10000);
                var draftPath = "/GRVCOA04";
                var pageSize = 100; 
                var skip = 0; 
                var filter = [new sap.ui.model.Filter("IsActiveEntity", sap.ui.model.FilterOperator.EQ, false)]
                function fetchData(path, skip, accumulatedData = []) {
                    return new Promise((resolve, reject) => {
                        // var query = path + "?$skip=" + skip + "&$top=" + pageSize;
                        var query = path;
                        mainModel.read(query, {
                            filter: filter,
                            success: function (oData) {
                                var newData = accumulatedData.concat(oData.results);
                                // if (oData.results.length === pageSize) {
                                //     fetchData(path, skip + pageSize, newData).then(resolve).catch(reject);
                                // } else {
                                    resolve(newData);
                                // }
                            },
                            error: function (oError) {
                                reject("Failed to read draft data: " + oError.message);
                            }
                        });
                    });
                }
            
                fetchData(draftPath, skip).then(function (allData) {
                    var userDrafts = allData.filter(item => item.CreatedBy === "CB9980000001");
                    if (userDrafts.length > 0) {
                        // userDrafts.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
                        self._confirmDraftData(userDrafts);
                    }
                }).catch(function (error) {
                    console.error(error);
                });
            },
            
            _confirmDraftData: function (draftData) {
                var self = this;
                sap.m.MessageBox.confirm(
                    "이전에 저장되지 않은 데이터가 있습니다. 계속하시겠습니까?",
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.YES) {
                                self._bindDraftDataToTable(draftData);
                            }
                        }
                    }
                );
            },
            
            _bindDraftDataToTable: function (draftData) {
                var transformedData = draftData.map(item => ({
                    Uuid: item.Uuid,
                    CnsldtnCOA: item.Ritclg,
                    CnsldtnUnit: item.Rbunit,
                    MappingID: item.MappingId,
                    Revision: item.Revision,
                    CnsldtnFSItem: item.Ritem,
                    GLAccount: item.Zracct,
                    GLAccountLocalText: item.ZracctTextLo,
                    GLAccountGroupText: item.ZracctTextGr
                }));
            
                _oViewTableModel.setProperty("/", transformedData);
                _oViewTableModel.refresh(true);
                _oLayout.setProperty("/tableCnt", transformedData.length);
                _oLayout.setProperty("/excelUploadSave", true);
                _oLayout.refresh(true);
                _oTable.setModel(_oViewTableModel);
                _oTable.getBinding("rows").refresh(true);
            },

            */

            onToolbarRefreshPress: function () {
                var self = this;
                sap.m.MessageBox.confirm(
                    "임포트 하지 않은 내용들이 삭제됩니다. 진행하시겠습니까?",
                    {
                        actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.YES) {
                                _oViewTableModel.setProperty("/", []);
                                _oLayout.setProperty("/tableCnt", 0);
                            }
                        }
                    }
                );
            },

            refreshTable: function () {
                _oTable.getBinding("rows").refresh(true);
            },

            onSave: function () {
                var self = this;
                var oDialog = this._createUploadDialog();
                var createText = sap.ui.getCore().byId("createText");
                var deleteInterval = this._startDotAnimation(createText);
            
                oDialog.attachAfterClose(function() {
                    clearInterval(deleteInterval);
                });
            
                MessageBox.confirm(_i18n.getText("MSG_CHECK_EXCEL"), {
                    actions: ["확인", sap.m.MessageBox.Action.CANCEL],
                    styleClass: "sapUiSizeCompact",
                    onClose: function (sAction) {
                        if (sAction === "확인") {
                            _oTable.setBusy(true);
                            oDialog.open();
                            var oModelMain = self.getView().getModel("oMODELMAIN");
                            var currentData = _oViewTableModel.getData();
                            var createProgress = sap.ui.getCore().byId("createProgress");
            
                            // Separate header data processing
                            this._processHeaderData(oModelMain, currentData)
                                .then(() => {
                                    return this._processUpload(self, oModelMain, currentData, createProgress, oDialog);
                                })
                                .then(() => {
                                    _oViewTableModel.setData([]);
                                    _oViewTableModel.refresh(true);
                                    _oLayout.setProperty("/tableCnt", 0);
                                    _oLayout.refresh(true);
                                    self.refreshTable();
                                })
                                .then(() => {
                                  
                                })
                                .catch((error) => {
                                    console.error('An error occurred while processing data:', error);
                                    var errorMsg = error.message || JSON.stringify(error);
                                    MessageBox.error(_i18n.getText("MSG_UPLOAD_FAIL") + errorMsg, {
                                        onClose: function () {
                                            _oTable.setBusy(false);
                                            oDialog.close();
                                        }
                                    });
                                });
                        } else {
                            oDialog.close();
                        }
                    }.bind(this)
                });
            },
            
            _createUploadDialog: function() {
                var oDialog = new sap.m.Dialog({
                    title: "매핑 엑셀 임포트",
                    content: [
                        new sap.ui.layout.VerticalLayout({
                            width: "90%",
                            content: [
                                new sap.m.Text({ id: "createText", text: "엑셀 임포트 진행중"}).addStyleClass("sapUiSmallMarginTop"),
                                new sap.m.ProgressIndicator({
                                    id: "createProgress",
                                    percentValue: 0,
                                    displayValue: "0%",
                                    width: "auto"
                                }).addStyleClass("sapUiSmallMarginBottom"),
                            ]
                        }).addStyleClass("sapUiContentPadding")
                    ],
                    beginButton: new sap.m.Button({
                        text: "취소",
                        press: function () {
                            oDialog.close();
                            _oTable.setBusy(false);
                        }
                    }),
                    afterClose: function () {
                        oDialog.destroy();
                    },
                    contentWidth: "400px",
                    contentHeight: "150px",
                    horizontalScrolling: false,
                    verticalScrolling: true
                });
            
                oDialog.addStyleClass("sapUiResponsivePadding");
            
                return oDialog;
            },
            
            _startDotAnimation: function(textElement) {
                var dotCount = 0;
                
                var animateDots = function() {
                    dotCount = (dotCount + 1) % 4;
                    var dots = ".".repeat(dotCount);
                    textElement.setText("엑셀 임포트 진행중" + dots);
                };
            
                return setInterval(animateDots, 500);
            },
            
            _processHeaderData: function(oModelMain, currentData) {
                var headerTable1Data = new Set();
                var headerTable2Data = new Set();
            
                currentData.forEach(function(item) {
                    headerTable1Data.add(item.MappingID);
                });
            
                currentData.forEach(function(item) {
                    var key = `${item.CnsldtnCOA}|${item.CnsldtnUnit}|${item.MappingID}|${item.Revision}`;
                    headerTable2Data.add(key);
                });
            
                return Promise.all([
                    this._createHeaderTable1Data(oModelMain, Array.from(headerTable1Data)),
                    this._createHeaderTable2Data(oModelMain, Array.from(headerTable2Data))
                ]);
            },
            
            _createHeaderTable1Data: function(oModelMain, headerTable1Data) {
                var createPromises = headerTable1Data.map(mappingId => this._createHeaderTable1DataItem(oModelMain, mappingId));
                return Promise.all(createPromises);
            },
            
            _createHeaderTable1DataItem: function(oModelMain, mappingId) {
                return new Promise((resolve, reject) => {
                    oModelMain.create("/GRVCOA01", { MappingId: mappingId }, {
                        success: resolve,
                        error: reject
                    });
                });
            },
            
            _createHeaderTable2Data: function(oModelMain, headerTable2Data) {
                var createPromises = headerTable2Data.map(key => this._createHeaderTable2DataItem(oModelMain, key));
                return Promise.all(createPromises);
            },
            
            _createHeaderTable2DataItem: function(oModelMain, key) {
                var [ritclg, rbunit, mappingId, revision] = key.split('|');
                return new Promise((resolve, reject) => {
                    oModelMain.create("/GRVCOA02", {
                        Ritclg: ritclg,
                        Rbunit: rbunit,
                        MappingId: mappingId,
                        Revision: revision
                    }, {
                        success: resolve,
                        error: reject
                    });
                });
            },
            
            _processUpload: function(self, oModelMain, currentData, createProgress,oDialog) {
                this.createData(oModelMain, currentData, createProgress)
                    .then(() => {
                        createProgress.setPercentValue(100);
                        createProgress.setDisplayValue("100%");
                        createProgress.setState("Success");
                        oDialog.close();
                        sap.m.MessageBox.success(_i18n.getText("MSG_UPLOAD_SUCCESS"),{
                            actions: [sap.m.MessageBox.Action.YES],
                            onClose: function (sAction) {
                                if (sAction === sap.m.MessageBox.Action.YES) {
                                    _oTable.setBusy(false);
                                    self.getView().getModel("ui").setProperty("/isNewDataAvailable", true);
                                    window.history.go(-1);
                                }
                            }
                        });
                    })
                    .catch((error) => {
                        var errorMsg = error.message || JSON.stringify(error);
                        MessageBox.error(_i18n.getText("MSG_UPLOAD_FAIL") + errorMsg);
                    });
            },
            
            
            createData: function (oModel, data, createProgress) {
                function ensureString(value) {
                    return typeof value === 'number' ? value.toString() : value;
                }
                var createPromises = data.map((item, index) => {
                    return new Promise((resolve, reject) => {
                        var transformedItem = {
                            Ritclg: ensureString(item.CnsldtnCOA),
                            Rbunit: ensureString(item.CnsldtnUnit),
                            MappingId: ensureString(item.MappingID),
                            Revision: ensureString(item.Revision),
                            Ritem: ensureString(item.CnsldtnFSItem),
                            Zracct: ensureString(item.GLAccount),
                            ZracctTextLo: item.GLAccountLocalText,
                            ZracctTextGr: item.GLAccountGroupText,
                            IsActiveEntity: true
                        };
                        oModel.create("/GRVCOA04", transformedItem, {
                            success: function () {
                                var percent = ((index + 1) / data.length) * 100;
                                createProgress.setPercentValue(percent);
                                createProgress.setDisplayValue(`${Math.round(percent)}%`);
                                resolve();
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });
                });
            
                return Promise.all(createPromises);
            },
            
            
            callFunctionDelete: function (oModel, uuid) {
                return new Promise(function (resolve, reject) {
                    oModel.callFunction("/GRVCOA04Discard", {
                        method: "POST",
                        urlParameters: {
                            Uuid: uuid,
                            IsActiveEntity: false
                        },
                        success: function () {
                            resolve();
                        },
                        error: function (oError) {
                            reject(oError);
                        }
                    });
                });
            },
            
            activeDraft: function (model, path, dataArray) {
                return Promise.all(
                    dataArray.map(singleData =>
                        new Promise((resolve, reject) => {
                            model.create(path, singleData, {
                                success: function (data) {
                                    resolve(data.Uuid);
                                },
                                error: function () {
                                    reject();
                                }
                            });
                        })
                    )
                );
            },

            onDownloadPress : function() {
                var self = this;
                var serviceurl = "/sap/opu/odata/sap/ZSB_GRVCOA/";
            
                var oModel = new sap.ui.model.odata.ODataModel(serviceurl);
                oModel.read("UploadedTemplateEntity(guid'b5bda6b1-cb48-1edf-9086-f2dc710f2110')", {
                    method: "GET",
                    success: function(data, response) {
                        var fName = data.FileName;
                        var fType = data.MimeType;
                        var fContent = data.Attachment;
            
                        // 엑셀 파일인 경우 처리
                        if (fType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                            var byteCharacters = atob(fContent);
                            var byteNumbers = new Array(byteCharacters.length);
                            for (var i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            var byteArray = new Uint8Array(byteNumbers);
                            var blob = new Blob([byteArray], { type: fType });
                            var url = URL.createObjectURL(blob);
                            var link = document.createElement("a");
                            link.href = url;
                            link.download = fName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } else {
                            alert("The file type is not supported for download.");
                        }
            
                        // MessageToast.show("FILE Downloaded Successfully");
                    },
                    error: function(e) {
                        console.log(e);
                        alert("Error");
                    }
                });
            },
            

            excelHandleUploadComplete: function (oEvent) {
                var oFileForm = oEvent.getSource().getDomRef();
                var $oFileInput = $(oFileForm).find("input[type='file']");
                this.excelUpload($oFileInput[0]);
            },

            excelHandleUploadPress: function (oEvent) {
                var self = this,
                    oFileUploader = self.byId("pgdc0010.uploader");

                if (!oFileUploader.getShortenValue()) {
                    return MessageToast.show(_i18n.getText("MSG_EXCEL_FILE"), { width: "30em", at: "center" });
                } else {
                    _vFlg = true;
                }
                
                if(_vFlg){
                    _oTable.setBusy(true);
                    oFileUploader.upload();
                }
                        
         
            },

            excelUpload: function (fileUpload) {
                var self = this;
                if (typeof (FileReader) !== "undefined") {
                    var reader = new FileReader();
                    if (reader.readAsBinaryString) {
                        reader.onload = function (e) {
                            self.excelProcess(e.target.result);
                        };
                        reader.readAsBinaryString(fileUpload.files[0]);
                    } else {
                        reader.onload = function (e) {
                            var data = "";
                            var bytes = new Uint8Array(e.target.result);
                            for (var i = 0; i < bytes.byteLength; i++) {
                                data += String.fromCharCode(bytes[i]);
                            }
                            self.excelProcess(data);
                        };
                        reader.readAsArrayBuffer(fileUpload.files[0]);
                    }
                } else {
                    MessageToast.show(_i18n.getText("MSG_EXCEL_ERROR"));
                }
            },

            excelProcess: function (data) {
                var textModel = this.getView().getModel('oMODELMAIN');
                var workbook = XLSX.read(data, { type: 'binary' });
                var firstSheet = workbook.SheetNames[0];
                var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);
                var aCols = this.excelColumnConfig();
                var aUploadData = [];
                var self = this;
                var errText = "";
            
                var expectedTemplate = [
                    "CnsldtnCOA",
                    "MappingID",
                    "Revision",
                    "CnsldtnUnit",
                    "GLAccount",
                    "GLAccountLocalText",
                    "GLAccountGroupText",
                    "CnsldtnFSItem",
                    "CnsldtnFSItemMediumText"
                ];
            
                var firstRow = workbook.Sheets[firstSheet]["!ref"];
                var firstRowData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 })[0];
                var isTemplateValid = Object(expectedTemplate).every((key, index) => firstRowData[index] === key);
                
                if (!isTemplateValid) {
                    errText = _i18n.getText("MSG_CHECK_FIEDL");
                    return MessageBox.error(errText, {
                        onClose: function() {
                            _oTable.setBusy(false);
                        }
                    });
                }

                textModel.metadataLoaded().then(function() {
                    var allData = [];
                    var fetchData = function(skipToken) {
                        var params = {
                          
                        };
                        if (skipToken) {
                            params.$skiptoken = skipToken;
                        }
                        return new Promise(function(resolve, reject) {
                            textModel.read('/CnsldtnFSItemText', {
                                urlParameters: params,
                                success: function(oData) {
                                    allData = allData.concat(oData.results);
                                    if (oData.__next) {
                                        var nextSkipToken = oData.__next.split("$skiptoken=")[1];
                                        resolve(fetchData(nextSkipToken));
                                    } else {
                                        resolve(allData);
                                    }
                                },
                                error: function(oError) {
                                    reject(oError);
                                }
                            });
                        });
                    };
            
                    fetchData().then(function(textData) {
                        excelRows.slice(3).forEach(function(item, idx) {
                            var exData = {};
                            aCols.forEach(function(col) {
                                var tempPath = col.property;
                                if (typeof item[tempPath] === 'number') {
                                    exData[tempPath] = item[tempPath].toString();
                                } else {
                                    exData[tempPath] = item[tempPath];
                                }
                            });
            
                            // JSON 모델에서 매핑된 값을 찾아서 추가
                            var textItem = textData.find(function(textItem) {
                                return textItem.ConsolidationChartOfAccounts === exData.CnsldtnCOA &&
                                       textItem.CnsldtnFinancialStatementItem === exData.CnsldtnFSItem;
                            });
            
                            if (textItem) {
                                exData.CnsldtnFSItemText = textItem.CnsldtnFSItemText;
                                exData.CnsldtnFSItemMediumText = textItem.CnsldtnFSItemMediumText;
                            } else {
                                exData.CnsldtnFSItemText = '';
                                exData.CnsldtnFSItemMediumText = '';
                            }
            
                            exData.IsActiveEntity = true;
                            aUploadData.push(exData);
                        });
                 
            
                    var currentData = _oViewTableModel.getData() || [];
                    aUploadData.forEach(function (uploadItem) {
                        var matchIndex = currentData.findIndex(function (existingItem) {
                            return existingItem.CnsldtnCOA === uploadItem.CnsldtnCOA &&
                                existingItem.MappingID === uploadItem.MappingID &&
                                existingItem.Revision === uploadItem.Revision &&
                                existingItem.CnsldtnUnit === uploadItem.CnsldtnUnit &&
                                existingItem.GLAccount === uploadItem.GLAccount;
                        });
                
                        if (matchIndex !== -1) {
                            // Update existing item with new data
                            currentData[matchIndex] = Object.assign({}, currentData[matchIndex], uploadItem);
                        } else {
                            // Add new item
                            currentData.push(uploadItem);
                        }
                    });
            
                    _oViewTableModel.setProperty("/", []);
                    _oViewTableModel.refresh(true);
            
                    setTimeout(function () {
                        _oViewTableModel.setProperty("/", currentData);
                        _oViewTableModel.refresh(true);
                        _oLayout.setProperty("/tableCnt", currentData.length);
                        _oLayout.setProperty("/excelUploadSave", true);
                        _oLayout.refresh(true);
                        _oTable.setModel(_oViewTableModel);
                        _oTable.getBinding("rows").refresh(true);
                    }, 0);
                
                    self.byId("pgdc0010.uploader").setValue("");
                    self.excelImport();
                
                    if (!_vFlg) {
                        return MessageToast.show(errText);
                    }

                    self.finalDataArray = self.finalDataArray || [];
                    aUploadData.forEach(function (item) {
                        var createData = {
                            'Ritclg': item.CnsldtnCOA,
                            'Rbunit': item.CnsldtnUnit,
                            'MappingId': item.MappingID,
                            'Revision': item.Revision,
                            'Ritem': item.CnsldtnFSItem,
                            'Zracct': item.GLAccount,
                            'ZracctTextLo': item.GLAccountLocalText,
                            'ZracctTextGr': item.GLAccountGroupText,
                            'IsActiveEntity': true
                        };
                        self.finalDataArray.push(createData);
                    });

                    _oTable.setBusy(false);
                    })
                })
            },
            

            excelImport: function () {
                var uploaderVisible = _oLayout.getProperty("/uploaderVisible");
                if (!uploaderVisible) {
                    _oViewTableModel.setProperty("/", []);
                    _oLayout.setProperty("/tableCnt", 0);
                }
                _oLayout.setProperty("/uploaderVisible", !uploaderVisible);
                _oLayout.setProperty("/exportVisible", false);
            },

            excelColumnConfig: function () {
                var oView, aColumns, aColumnConfig;

                oView = this.getView();
                aColumns = _oTable.getColumns();

                aColumnConfig = aColumns.map(
                    function (oCol) {
                        var bVisible = oCol.getVisible();

                        if (bVisible) {
                            var sLabel = $.trim(oCol.getLabel().getText()),
                                oBindingInfo = this.excelBindingInfo(oCol),
                                sPath;
                            if (oBindingInfo === undefined) {
                                sPath = "";
                            } else {
                                sPath = oBindingInfo.parts[0].path;
                            }
                            return {
                                label: sLabel,
                                property: sPath
                            };
                        }
                    }.bind(this)
                );
                return aColumnConfig;
            },

            excelBindingInfo: function (col) {
                var colTemp = col.getTemplate(),
                    sResult = "";

                if (colTemp.getText) {
                    sResult = colTemp.getBindingInfo("text");
                } else if (colTemp.getValue) {
                    sResult = colTemp.getBindingInfo("value");
                } else {
                    return sResult;
                }
                return sResult;
            }
        });
    });
