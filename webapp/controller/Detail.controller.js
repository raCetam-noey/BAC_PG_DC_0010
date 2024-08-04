sap.ui.define('pgdc0010/controller/Detail.controller',
    ["pgdc0010/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History", 
    "sap/ui/model/Filter", 
    "sap/ui/model/FilterOperator", 
    "sap/ui/generic/app/navigation/service/NavigationHandler", 
    "pgdc0010/model/formatter", 
    "pgdc0010/util/Constants", 
    "sap/m/MessageToast"], 
    function(BaseController, JSONModel, History, Filter, aFilter, NavigationHandler, formatter, Constants, MessageToast) {
    "use strict";
    return BaseController.extend("pgdc0010.controller.Detail", {
        formatter: formatter,
        _aMapSelectedIndices: [],
        _aGlaSelectedIndices: [],
        _aFsiSelectedIndices: [],
        ASYNC_LOAD: false,
        EDIT_MODE: false,
        _update_aMapSelectedIndices: function() {
            this._aMapSelectedIndices = this._oMappingTable.getPlugins()[0].getSelectedIndices();
            return this._aMapSelectedIndices;
        },
        onInit: function() {
            var initialBusyDelay, viewModel  = new JSONModel({
                busy: true,
                delay: 0
            });
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
        
            var saveText = this.getResourceBundle().getText("SaveButtonText");
            var discardText = this.getResourceBundle().getText("DiscardButtonText");
            var warningMessage = this.getResourceBundle().getText("WarningMsgContent");
            var isCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
        
            sap.m.MessageBox.warning(warningMessage, {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: "Warning",
                actions: [saveText, discardText],
                emphasizedAction: saveText,
                styleClass: isCompact ? "sapUiSizeCompact" : "",
                initialFocus: discardText,
                onClose: function(response) {
                    if (response === saveText) {
                        this._activeDraftPromise({
                            FSItemMappingUUID: this._sDraftUuid
                        }, navigateBack);
                    }
                    if (response === discardText) {
                        this._discardDraftPromise({
                            FSItemMappingUUID: this._sDraftUuid
                        }, navigateBack);
                    }
                    this.getModel("ui").setProperty("/deleteMapBtnEnabled", false);
                }.bind(this)
            });
        },        
        onNavSection: function(event) {
            if (!this.ASYNC_LOAD) {
                return;
            }
            var sectionId = event.getParameter("section").getId();
            this.oObjectPageLayout.setSelectedSection(sectionId);
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

        _fnRemoveObjects: function() {
          
        },
        _createObjectPromise: function(p, o) {
        
        },
        _removeObjectPromise: function(p, o, r) {
           
        },
        _updateObjectPromise: function(p, o) {
         
        },
        _createDraftPromise: function(d) {
          
        },
        _discardDraftPromise: function(d, c) {
          
        },
        _activeDraftPromise: function(d, c) {
           
        },
        _setEditMode: function(e) {
            if (typeof e !== "undefined") {
                this.EDIT_MODE = e;
            }
            this.getView().getModel("ui").setProperty("/editMode", this.EDIT_MODE);
            this.getView().getModel("ui").setProperty("/messageTextColumnVisible", this.EDIT_MODE);
            this._oPage.setShowFooter(this.EDIT_MODE);
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
            }
            .bind(this));
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
        }
    });
});