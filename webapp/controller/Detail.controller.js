sap.ui.define('pgdc0010/controller/Detail.controller',
    ["pgdc0010/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History", 
    "sap/ui/model/Filter", 
    "sap/ui/model/FilterOperator", 
    "sap/ui/generic/app/navigation/service/NavigationHandler", 
    "pgdc0010/model/formatter", 
    "pgdc0010/util/Constants", 
    "sap/m/MessageToast",
    "sap/m/MessageBox"], 
    function(BaseController, JSONModel, History, Filter, FilterOperator, NavigationHandler, formatter, Constants, MessageToast, MessageBox) {
    "use strict";
    return BaseController.extend("pgdc0010.controller.Detail", {
        formatter: formatter,
        _aMapSelectedIndices: [],
        _aGlaSelectedIndices: [],
        _aFsiSelectedIndices: [],
        ASYNC_LOAD: false,
        EDIT_MODE: false,
        _originalData: [],
        
        _update_aMapSelectedIndices: function() {
            this._aMapSelectedIndices = this._oMappingTable.getPlugins()[0].getSelectedIndices();
            return this._aMapSelectedIndices;
        },
        
        onInit: function() {
            var initialBusyDelay, viewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            
            // Initialize UI model if not already there
            if (!this.getModel("UIModel")) {
                this.setModel(new JSONModel({
                    editable: false
                }), "UIModel");
            }
            
            this.oObjectPageLayout = this.getView().byId("pgdc0010.ObjectPageLayout");
            this._oPage = this.getView().byId(Constants.MapDetailPageId);
            this._oPage.setBusy(true);
            this._oMappingSmartTable = this.getView().byId(Constants.MappingSmartTableId);
            this._oMappingTable = this._oMappingSmartTable.getTable();
            this._aAllTables = [this._oMappingTable];
            
            this.getRouter().getRoute("worklist").attachPatternMatched(this.onWorklistMatched, this);
            this.getRouter().getRoute("Detail").attachPatternMatched(this.onObjectMatched, this);
            this.getRouter().getRoute("DetailWithAppState").attachPatternMatched(this.onObjectMatched, this);
            
            initialBusyDelay = this.getView().getBusyIndicatorDelay();
            this.setModel(viewModel, "detailView");
            
            this.getOwnerComponent().getModel().metadataLoaded().then(function() {
                viewModel.setProperty("/delay", initialBusyDelay);
            });
            
            this._oNavigationHandler = new NavigationHandler(this);
            this._oNavigationHandler.parseNavigation().done(this.onNavigationDone.bind(this));
            
            this._initAppState();
        },
        
        onNavigationDone: function(appState, urlParameters, navigationType) {
            switch (navigationType) {
            case "initial":
                break;
            case "iAppState":
            case "xAppState":
                this._oAppState = appState.customData;
                break;
            }
        },
        
        onWorklistMatched: function(e) {
            this._oMappingTable.unbindRows();
            var uiModel = this.getView().getModel("ui");
            uiModel.setProperty("/glaTableVisible", false);
            uiModel.setProperty("/fsiTableVisible", false);
            var sectionMap = this.getView().byId(Constants.SectionMapId);
            this.byId("pgdc0010.mapping.detail.searchField").setValue("");
            this._initAppState();
        },
        
        onObjectMatched: function(e) {
            var self = this;
            if (!this.placeholderContainer) {
                this.placeholderContainer = e.getParameter("targetControl");
            } else if (!this.loadingPlaceholderIsActivelyShown) {
                this.placeholderContainer.hidePlaceholder();
            }
            this.loadingPlaceholderIsActivelyShown = true;
            this.sObjectId = e.getParameter("arguments").objectId;
            if (typeof this.sObjectId === "undefined" || !this.sObjectId) {
                return;
            }
            this._setAnchorBarNumbers([]);
            this.getModel().metadataLoaded().then(function() {
                var path = Constants.MappingHeaderEntitySet + "(guid'" + this.sObjectId + "')";
                this._bindView(path);
                this._dataBindingAllTables();
                this.getView().getModel().read(path, {
                    success: function(d, r) {
                        //화면 헤더 데이터
                        var viewModel = new JSONModel({
                            ObjectId: this.sObjectId,
                            ConsCoA: d.Ritclg,
                            ConsUnit: d.Rbunit,
                            ConsUnitHeader: d.Rbunit,
                            ConsolidationChartOfAccounts: d.Ritclg,
                            ConsolidationChartOfAcctsHeader: d.Ritclg,
                            FSItemMappingId: d.MappingId,
                            FSItemMappingIdHeader: d.MappingId,
                            FSItemMappingRevision: d.Revision,
                            FSItemMappingRevisionText: d.RevisionTextLo,
                            FSItemMappingRevisionHeader: d.Revision + " (" + d.RevisionTextLo + ")",
                            GrStatus: d.GrStatus
                        });
                        this.setModel(viewModel, "detailView");
                        self.filters = [
                            new sap.ui.model.Filter("CnsldtnCOA", sap.ui.model.FilterOperator.EQ, d.Ritclg),
                            new sap.ui.model.Filter("MappingID", sap.ui.model.FilterOperator.EQ, d.MappingId),
                            new sap.ui.model.Filter("Revision", sap.ui.model.FilterOperator.EQ, d.Revision),
                            new sap.ui.model.Filter("CnsldtnUnit", sap.ui.model.FilterOperator.EQ, d.Rbunit)
                        ];
        
                        this._oMappingTable.getParent().rebindTable(true);
                        this._oMappingTable.getBinding("rows").filter(self.filters);

                        if (this.placeholderContainer) {
                            this.placeholderContainer.hidePlaceholder();
                            this.loadingPlaceholderIsActivelyShown = false;
                        }
                        
                        if (!d.ObjectId || this._oAppState.bEditMode) {
                            return;
                        }
                        
                        this._restoreAppState();
                        
                        if (d.ObjectId) {
                            this._setEditMode(false);
                        }
                    }
                    .bind(this),
                    error: function(E) {
                        if (typeof history !== "undefined") {
                            history.go(-1);
                        }
                    }
                });
            }
            .bind(this));
        },
        
        onBeforeRebindMapTable: function(e) {
            if (!this._sDraftUuid && !this.sObjectId) {
                e.getParameters().bindingParams.preventTableBind = true;
                e.getParameter("bindingParams").filters = this._mappingFilters;
            } else {
                var m = Constants.MappingItemEntitySet;
                e.getSource().setTableBindingPath(m);
                e.getParameter("bindingParams").filters = this._mappingFilters;
            }
            this._oBindingParamsMap = e.getParameter("bindingParams");
        },
       
        onNavBack: function() {
            var navigateBack = function() {
                var previousHash = History.getInstance().getPreviousHash();
                if (sap.ushell && sap.ushell.Container) {
                    var crossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                    if (previousHash !== undefined || !crossAppNav.isInitialNavigation()) {
                        if (typeof history !== "undefined") {
                            history.go(-1);
                        } else {
                            var shellHomeHash = "#Shell-home";
                            crossAppNav.toExternal({
                                target: {
                                    shellHash: shellHomeHash
                                }
                            });
                        }
                    } else {
                        this.getRouter().navTo("worklist");
                    }
                }
            }.bind(this);
        
            if (!this.EDIT_MODE) {
                navigateBack();
                return;
            }
        
            if (this._hasChanges()) {
                var saveText = this.getResourceBundle().getText("SaveButtonText");
                var discardText = this.getResourceBundle().getText("DiscardButtonText");
                var warningMessage = this.getResourceBundle().getText("WarningMsgContent");
                var isCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
                
                MessageBox.warning(warningMessage, {
                    icon: MessageBox.Icon.WARNING,
                    title: "Warning",
                    actions: [saveText, discardText],
                    emphasizedAction: saveText,
                    styleClass: isCompact ? "sapUiSizeCompact" : "",
                    initialFocus: discardText,
                    onClose: function(response) {
                        if (response === saveText) {
                            this.onEditSave(navigateBack);
                        }
                        if (response === discardText) {
                            this._resetChanges();
                            this._setEditMode(false);
                            navigateBack();
                        }
                        this.getModel("ui").setProperty("/deleteMapBtnEnabled", false);
                    }.bind(this)
                });
            } else {
                this._setEditMode(false);
                navigateBack();
            }
        },
        
        onNavSection: function(event) {
            if (!this.ASYNC_LOAD) {
                return;
            }
            var sectionId = event.getParameter("section").getId();
            this.oObjectPageLayout.setSelectedSection(sectionId);
        },

        // 편집 모드 활성화
        onToolbarEditPress: function(e) {
            // 편집 모드로 설정
            this._setEditMode(true);
            
            // 원본 데이터를 저장 (취소 시 사용)
            this._storeOriginalData();
            
            // UI 모델 속성 업데이트
            this.getModel("UIModel").setProperty("/editable", true);
            
            // 선택 항목에 따라 삭제 버튼 활성화
            this._update_aMapSelectedIndices();
            this.getView().getModel("ui").setProperty("/deleteMapBtnEnabled", 
                this._aMapSelectedIndices && this._aMapSelectedIndices.length > 0);
        },
        
        // 변경사항 저장
        onEditSave: function(callback) {
            var that = this;
            
            // 바쁨 표시기 표시
            this._oPage.setBusy(true);
            
            // 데이터 유효성 검사
            if (!this._validateData()) {
                this._oPage.setBusy(false);
                return;
            }
            
            // 변경된 데이터 수집
            var oModel = this.getModel();
            var oChanges = this._collectChanges();
            
            if (!oChanges || Object.keys(oChanges).length === 0) {
                // 변경사항이 없으면 편집 모드 종료
                MessageToast.show("변경사항 없음");
                this._setEditMode(false);
                this._oPage.setBusy(false);
                if (typeof callback === "function") {
                    callback();
                }
                return;
            }
            
            // 일괄 처리를 위한 준비
            oModel.setUseBatch(true);
            oModel.setDeferredGroups(["changes"]);
            
            // 변경사항 제출
            this._submitChanges(oChanges, function() {
                // 성공 시 콜백
                that._oPage.setBusy(false);
                that._setEditMode(false);
                
                // 성공 메시지 표시
                MessageToast.show(that.getResourceBundle().getText("ChangesSavedSuccessfully") || "Changes saved successfully");
                
                // UI 모델 속성 재설정
                that.getModel("UIModel").setProperty("/editable", false);
                
                // 테이블 데이터 새로고침
                that._refreshTableData();
                
                if (typeof callback === "function") {
                    callback();
                }
            }, function(oError) {
                // 오류 처리
                that._oPage.setBusy(false);
                MessageToast.show(that.getResourceBundle().getText("ErrorSavingChanges") || "Error saving changes");
            });
        },
        
        // 편집 취소
        onEditCancel: function() {
            var that = this;
            
            // 변경사항이 있는지 확인
            if (this._hasChanges()) {
                // 확인 전 취소 경고
                var discardText = this.getResourceBundle().getText("DiscardButtonText") || "Discard";
                var cancelText = this.getResourceBundle().getText("CancelButtonText") || "Cancel";
                var warningMessage = this.getResourceBundle().getText("CancelWarningMsg") || "Do you want to discard your changes?";
                var isCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
                
                MessageBox.warning(warningMessage, {
                    icon: MessageBox.Icon.WARNING,
                    title: "Warning",
                    actions: [discardText, cancelText],
                    emphasizedAction: discardText,
                    styleClass: isCompact ? "sapUiSizeCompact" : "",
                    initialFocus: cancelText,
                    onClose: function(response) {
                        if (response === discardText) {
                            // 변경사항 취소 및 편집 모드 종료
                            that._resetChanges();
                            that._setEditMode(false);
                            
                            // UI 모델 속성 재설정
                            that.getModel("UIModel").setProperty("/editable", false);
                        }
                        // 취소를 선택하면 편집 모드 유지
                    }
                });
            } else {
                // 변경사항이 없으면 편집 모드만 종료
                this._setEditMode(false);
                this.getModel("UIModel").setProperty("/editable", false);
            }
        },

        _initAppState: function() {
            this._oAppState = {
                sTargetSection: null,
                aSearchText: [],
                oFilters: {
                    MappingTable: []
                },
                oSorters: {
                    MappingTable: []
                },
                bCrossAppNavi: undefined,
                bEditMode: undefined,
                sDraftUuid: undefined,
                oBindingParamsMap: null
            };
        },
        
        _stashAppState: function(c) {
            if (c) {
                this._oAppState.bCrossAppNavi = c;
                this._oAppState.bEditMode = this.EDIT_MODE;
                this._oAppState.sDraftUuid = this._sDraftUuid;
            }
            this._oAppState.sTargetSection = this.oObjectPageLayout.getSelectedSection();
            this._oAppState.oBindingParamsMap = this._oBindingParamsMap;
            this._oAppState.oFilters = {
                MappingTable: this._oMappingTable.getBinding("rows").aFilters
            };
        },
        
        _restoreAppState: function() {
            if (jQuery.isEmptyObject(this._oAppState)) {
                return;
            }
            if (this._oAppState.bCrossAppNavi) {
                if (typeof this._oAppState.bEditMode === "boolean") {
                    this.EDIT_MODE = this._oAppState.bEditMode;
                    this._sDraftUuid = this._oAppState.sDraftUuid;
                    this.getView().getModel("ui").setProperty("/messageTextColumnVisible", this.EDIT_MODE);
                    this._oAppState.bCrossAppNavi = undefined;
                }
            }
            if (this._oAppState.sTargetSection) {
                this.oObjectPageLayout.setSelectedSection(this._oAppState.sTargetSection);
            }
            this._restoreAppStateSorting();
        },
        
        _restoreAppStateSorting: function() {

        },

        // 편집 모드 설정
        _setEditMode: function(e) {
            if (typeof e !== "undefined") {
                this.EDIT_MODE = e;
            }
            
            // UI 모델 속성 업데이트
            this.getView().getModel("ui").setProperty("/editMode", this.EDIT_MODE);
            this.getView().getModel("ui").setProperty("/messageTextColumnVisible", this.EDIT_MODE);
            
            // 푸터 표시/숨김
            this._oPage.setShowFooter(this.EDIT_MODE);
            
            // 테이블 선택 모드 업데이트
            this._aAllTables.map(function(t, i) {
                if (i === 2) {
                    if (this.EDIT_MODE) {
                        t.setSelectionMode(sap.ui.table.SelectionMode.Single);
                    } else {
                        t.setSelectionMode(sap.ui.table.SelectionMode.None);
                    }
                    t.clearSelection();
                } else {
                    var b = t.getPlugins()[0];
                    b.setSelectionMode(this.EDIT_MODE ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.None);
                    b.clearSelection();
                }
            }.bind(this));
            
            // 편집 모드가 아닌 경우 UI 모델 편집 가능 속성 재설정
            if (!this.EDIT_MODE) {
                this.getModel("UIModel").setProperty("/editable", false);
            }
            
            // SmartField의 편집 가능 상태 설정
            this._setSmartFieldsEditable(this.EDIT_MODE);
        },
        
        // SmartField 컴포넌트 편집 가능 상태 설정
        _setSmartFieldsEditable: function(bEditable) {
            // 편집 가능한 필드 목록
            var editableFields = [

            ];
            
            editableFields.forEach(function(fieldId) {
                try {
                    var oField = this.getView().byId(fieldId);
                    if (oField) {
                        oField.setEditable(bEditable);
                    }
                } catch (e) {
                    // 오류 처리
                    console.error("Field not found: " + fieldId);
                }
            }.bind(this));
            
            // SmartTable이 자동으로 모든 필드를 처리하지 않는 경우 이 방법 사용
            if (this._oMappingTable) {
                var aRows = this._oMappingTable.getRows();
                for (var i = 0; i < aRows.length; i++) {
                    var aCells = aRows[i].getCells();
                    for (var j = 0; j < aCells.length; j++) {
                        if (aCells[j].setEditable) {
                            aCells[j].setEditable(bEditable);
                        }
                    }
                }
            }
        },
        
        // 원본 데이터 저장 (취소시 복원용)
        _storeOriginalData: function() {
            var oBinding = this._oMappingTable.getBinding("rows");
            if (!oBinding) {
                return;
            }
            
            this._originalData = [];
            var contexts = oBinding.getContexts();
            
            for (var i = 0; i < contexts.length; i++) {
                var oContext = contexts[i];
                var oObject = jQuery.extend(true, {}, oContext.getObject());
                this._originalData.push(oObject);
            }
        },
        
        // 데이터 유효성 검사
        _validateData: function() {
            var oTable = this._oMappingTable;
            var aRows = oTable.getRows();
            var bValid = true;
            
            // 필수 필드 검사 등의 유효성 검사 로직
            for (var i = 0; i < aRows.length; i++) {
                var aCells = aRows[i].getCells();
                for (var j = 0; j < aCells.length; j++) {
                    if (aCells[j].getValueState && aCells[j].getValueState() === sap.ui.core.ValueState.Error) {
                        bValid = false;
                        break;
                    }
                }
            }
            
            if (!bValid) {
                MessageToast.show(this.getResourceBundle().getText("PleaseCorrectErrors") || "Please correct the errors before saving");
            }
            
            return bValid;
        },
        
        // 변경사항 수집
        _collectChanges: function() {
            var oChanges = {};
            var oModel = this.getModel();
            var aPendingChanges = oModel.getPendingChanges();
            
            if (aPendingChanges) {
                oChanges = aPendingChanges;
            }
            
            return oChanges;
        },
        
        // 변경사항 제출
        _submitChanges: function(oChanges, fnSuccess, fnError) {
            var oModel = this.getModel();
            
            oModel.submitChanges({
                groupId: "changes",
                success: function(oData) {
                    if (fnSuccess) {
                        fnSuccess(oData);
                    }
                },
                error: function(oError) {
                    if (fnError) {
                        fnError(oError);
                    }
                }
            });
        },
        
        // 변경사항 있는지 확인
        _hasChanges: function() {
            var oModel = this.getModel();
            var aPendingChanges = oModel.getPendingChanges();
            
            return aPendingChanges && Object.keys(aPendingChanges).length > 0;
        },
        
        // 변경사항 초기화
        _resetChanges: function() {
            var oModel = this.getModel();
            oModel.resetChanges();
            
            // 테이블 다시 바인딩하여 원본 데이터로 복원
            this._refreshTableData();
        },
        
        // 테이블 데이터 새로고침
        _refreshTableData: function() {
            if (this._oMappingSmartTable) {
                this._oMappingSmartTable.rebindTable();
            }
        },
        
        _setAnchorBarNumbers: function(r) {
            var s = [this.getView().byId(Constants.SubSectionMapId)];
            if (typeof r === "undefined") {
                this._aAllTables.map(function(v, i) {
                    var b = v.getBinding("rows");
                    b.attachChange(function() {
                        var R = (this.EDIT_MODE && i === 0) ? b.getLength() - 1 : b.getLength();
                        if (R === 0) {
                            s[i].setTitle(this.getResourceBundle().getText("ObjectSectionInitText" + i));
                        } else {
                            s[i].setTitle(this.getResourceBundle().getText("ObjectSectionText" + i, R));
                        }
                    }
                    .bind(this));
                }
                .bind(this));
                return;
            }
            if (r.length === 0) {
                s.map(function(v, i) {
                    s[i].setTitle(this.getResourceBundle().getText("ObjectSectionInitText" + i));
                }
                .bind(this));
            } else if (r.length === 3) {
                s.map(function(v, i) {
                    if (r[i] === 0 || typeof r[i] === "undefined") {
                        s[i].setTitle(this.getResourceBundle().getText("ObjectSectionInitText" + i));
                    } else {
                        s[i].setTitle(this.getResourceBundle().getText("ObjectSectionText" + i, r[i]));
                    }
                }
                .bind(this));
            }
        },
       
        _clearCtrlState: function(c) {
            if (c && c.length) {
                c.forEach(function(o) {
                    o.setValueState(sap.ui.core.ValueState.None);
                });
            }
        },

        _rebindAllTables: function(o) {
            o = encodeURIComponent(o);
            var m = Constants.MappingItemEntitySet + "('" + o + "')" + Constants.NavToMappingItem;
            this._oMappingTable.unbindRows();
            this._oMappingTable.bindRows({
                path: m
            });
        },

        _dataBindingAllTables: function() {
            var t = this;
            var u = this.getView().getModel("ui");
            var m = Constants.MappingItemEntitySet;
            var r = function() {
                var p = new Promise(function(c, d) {
                    t._oMappingTable.bindRows({
                        path: m
                    });
                    var e = function() {
                        if (c) {
                            c();
                        }
                    };
                    setTimeout(e, 0);
                }
                );
                return p;
            };
            var b = function() {
                var p = new Promise(function(c) {
                    t._setAnchorBarNumbers();
                    t._oPage.setBusy(false);
                }
                );
                return p;
            };
            r().then(b);
        },

        _bindView: function(o) {
            var v = this.getModel("detailView");
            var d = this.getModel();
            this.getView().bindElement({
                path: o,
                events: {
                    change: this._onBindingChange.bind(this)
                }
            });
        },
        
        _onBindingChange: function() {
            var v = this.getView();
            var V = this.getModel("detailView");
            var e = v.getElementBinding();
            if (!e.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }
            var r = this.getResourceBundle();
            var o = v.getBindingContext().getObject();
            var O = jQuery.sap.formatMessage("{0} ({1}) - {2} ({3})", [o.CnsldtnFSItem, o.CnsldtnFSItemText, o.GLAccount, o.GLAccountLocalText]);
            V.setProperty("/busy", false);
            V.setProperty("/saveAsTileTitle", r.getText("saveAsTileTitle", [O]));
            V.setProperty("/shareOnJamTitle", O);
        },
        
        // Handle row selection change
        onMapRowSelectionChange: function(oEvent) {
            this._update_aMapSelectedIndices();
            this.getView().getModel("ui").setProperty("/deleteMapBtnEnabled", 
                this._aMapSelectedIndices && this._aMapSelectedIndices.length > 0);
        },
        
        // Handle field changes
        onMappingItemChange: function(oEvent) {
            var oSource = oEvent.getSource();
            var oBinding = oSource.getBinding("value");
            var sPath = oBinding.getPath();
            var oContext = oSource.getBindingContext();
            
            // 필요한 경우 추가 검증 로직
            if (sPath === "CnsldtnCOA" || sPath === "Revision") {
                var sValue = oEvent.getParameter("newValue");
                if (!sValue) {
                    oSource.setValueState(sap.ui.core.ValueState.Error);
                    oSource.setValueStateText("This field is required");
                } else {
                    oSource.setValueState(sap.ui.core.ValueState.None);
                }
            }
        },

        // 선택된 행 삭제
        onDeleteSelectedRows: function() {
            var that = this;
            var oTable = this._oMappingTable;
            var oSelectionPlugin = oTable.getPlugins()[0];
            var aSelectedIndices = oSelectionPlugin.getSelectedIndices();
            
            // 선택된 항목이 없는 경우
            if (!aSelectedIndices || aSelectedIndices.length === 0) {
                MessageToast.show(this.getResourceBundle().getText("NoRowsSelected") || "No rows selected");
                return;
            }
            
            // 삭제 확인 메시지
            var deleteText = this.getResourceBundle().getText("DeleteButtonText") || "Delete";
            var cancelText = this.getResourceBundle().getText("CancelButtonText") || "Cancel";
            var warningMessage = "선택한 항목을 삭제하시겠습니까?";
            var isCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
            
            MessageBox.warning(warningMessage, {
                icon: MessageBox.Icon.WARNING,
                title: "매핑 삭제",
                actions: [deleteText, cancelText],
                emphasizedAction: deleteText,
                styleClass: isCompact ? "sapUiSizeCompact" : "",
                initialFocus: cancelText,
                onClose: function(response) {
                    if (response === deleteText) {
                        that._deleteSelectedRows(aSelectedIndices);
                    }
                }
            });
        },

        // 삭제 수행
        _deleteSelectedRows: function(aSelectedIndices) {
            var that = this;
            var oTable = this._oMappingTable;
            var oModel = this.getModel();
            var oBinding = oTable.getBinding("rows");
            var aContexts = [];
            
            // 바쁨 표시기 표시
            this._oPage.setBusy(true);
            
            // 선택된 행의 컨텍스트 획득
            aSelectedIndices.forEach(function(iIndex) {
                var oContext = oBinding.getContextByIndex(iIndex);
                if (oContext) {
                    aContexts.push(oContext);
                }
            });
            
            // 일괄 처리를 위한 준비
            oModel.setUseBatch(true);
            oModel.setDeferredGroups(["delete"]);
            
            // 삭제 요청 생성
            aContexts.forEach(function(oContext) {
                oModel.remove(oContext.getPath(), {
                    groupId: "delete"
                });
            });
            
            // 삭제 요청 제출
            oModel.submitChanges({
                groupId: "delete",
                success: function(oData) {
                    // 성공 시 처리
                    that._oPage.setBusy(false);
                    
                    // 선택 초기화
                    var oSelectionPlugin = oTable.getPlugins()[0];
                    oSelectionPlugin.clearSelection();
                    
                    // 삭제 버튼 비활성화
                    that.getView().getModel("ui").setProperty("/deleteMapBtnEnabled", false);
                    
                    // 성공 메시지 표시
                    var sMessage = aContexts.length + " 건의 항목이 삭제되었습니다.";
                    MessageToast.show(sMessage);
                    
                    // 테이블 새로고침
                    that._refreshTableData();
                },
                error: function(oError) {
                    // 오류 처리
                    that._oPage.setBusy(false);
                    MessageToast.show(that.getResourceBundle().getText("ErrorDeletingRows") || 
                        "Error deleting rows");
                }
            });
        },

        // Delete button press handler - for CommandExecution
        onToolbarDeletePress: function() {
            this.onDeleteSelectedRows();
        },

        // 테이블 새로고침 (기존 메서드)
        _refreshTableData: function() {
            if (this._oMappingSmartTable) {
                this._oMappingSmartTable.rebindTable();
            }
        }
    });
});