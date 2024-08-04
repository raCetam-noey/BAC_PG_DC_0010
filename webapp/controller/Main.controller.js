sap.ui.define([
    "pgdc0010/controller/BaseController", 
    "../model/formatter",
    "sap/m/Input", 
    "sap/m/Select", 
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/generic/app/navigation/service/NavigationHandler", 
    "pgdc0010/util/Constants", 
    "sap/ui/comp/state/UIState", 
    "sap/ui/generic/app/navigation/service/SelectionVariant"
],
function (
    BaseController,
    formatter,
    Input,
    Select,
    Json,
    History,
    NavigationHandler,
    Constants,
    UIState,
    SelectionVariant) {
    "use strict";

    return BaseController.extend("pgdc0010.controller.Main", {
        formatter: formatter,
        INIT_SORT: false,

        onInit: function() {
            this._handleInboundNavigation(); //다른 피오리 앱에서 접근 시 파라미터 체크
            this._oFullPage = this.getView().byId("pgdc0010.worklist");
            this._oFullPage.setBusyIndicatorDelay(1); 
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

            this._oSmartTable = this.getView().byId(Constants.SmartTableId);
            this._oAnalyticalTable = this.getView().byId(Constants.AnalyticalTableId);
            this.getRouter().getRoute("worklist").attachPatternMatched(this.onWorklistMatched, this); //앱 라우터 매치 
            this.getRouter().getRoute("iAppState").attachPatternMatched(this.onWorklistMatched, this); //App State 매치 
            this._oFullPage.setBusy(false);
            this._oNavigationHandler = new NavigationHandler(this);
        },

        refreshWorklistIfNewDataIsAvailable: function() { // 신규 데이터 바인딩 체크
            var i = this.getModel("ui").getProperty("/isNewDataAvailable");
            if (i) {
                this._refreshWorklistContent();
                this.getModel("ui").setProperty("/isNewDataAvailable", false);
            }
        },
        
        _refreshWorklistContent: function() {
            this.byId("pgdc0010.Worklist.smartFilterBar").fireSearch();
        },

        onWorklistMatched: function(e) {
            if (!this.placeholderContainer) {
                this.placeholderContainer = e.getParameter("targetControl");
            } else if (!this.loadingPlaceholderIsActivelyShown) {
                this.placeholderContainer.hidePlaceholder();
            }
            this.refreshWorklistIfNewDataIsAvailable();

        },

        onAfterRendering: function() {
            var s = this.getView().byId(Constants.SmartFilterBarId);
            var d = s.getVariantManagement().getDefaultVariantKey();
        },

        onBeforeRebindSmartTable: function(e) { //테이블 기본 설정
            this._oBindingParams = e.getParameter("bindingParams");
            if (this._oBindingParams.sorter.length === 0) {
                if (!this.INIT_SORT) {
                    this.INIT_SORT = true;
                    this._sortDefaultColumns();
                }
            }
            this.byId("analyticalTableSelectionPlugin").clearSelection();
            this._oBindingParams.events.dataReceived = function() {
                if (this.placeholderContainer) {
                    this.placeholderContainer.hidePlaceholder();
                    this.loadingPlaceholderIsActivelyShown = false;
                }
            }
            .bind(this);
            this.loadingPlaceholderIsActivelyShown = true;
        },

        onExit: function() {
            
            if (this._oCreateMappingDialog) {
                this._oCreateMappingDialog.destroy(true);
                delete this._oCreateMappingDialog;
                this._oCreateMappingDialog = null;
            }
            if (this._oCreateRevisionDialog) {
                this._oCreateRevisionDialog.destroy(true);
                delete this._oCreateRevisionDialog;
                this._oCreateRevisionDialog = null;
            }
        },
        onToolbarRefreshPress: function() {
            this._oFullPage.setBusy(true);
            if (this._oAnalyticalTable.getBinding("rows")) {
                this._oAnalyticalTable.getBinding("rows").refresh();
            }
            var s = this.getView().byId("pgdc0010.Worklist.smartFilterBar");
            if (s && s.fireSearch) {
                s.fireSearch();
            }
            if (this._oFullPage.getBusy()) {
                this._oFullPage.setBusy(false);
            }
        },

        // onToolbarExportPress: function() {
        //     var d = this.getOwnerComponent().getModel();
        //     var m = d.getMetaModel().oMetadata;
        //     var e = m && m._getEntityTypeByName(Constants.MappingTypeEntitySetName);
        //     var F = sap.ui.model.odata.ODataUtils.createFilterParams(this._oBindingParams.filters, m, e);
        //     var E = d.sServiceUrl + Constants.ExportMappingCollectionSetUrl;
        //     E += (F) ? ("?" + F) : "";
        //     sap.m.URLHelper.redirect(E, true);
        // },

        // onToolbarExportWithSelectionPress: function() {
        //     var that = this;
        //     this._oFullPage.setBusy(true);
        //     this._arrayMapSelectedIndices = this.byId("analyticalTableSelectionPlugin").getSelectedIndices();
        //     var selectedIndicesLength = this._arrayMapSelectedIndices.length;
        //     for (var index = 0; index < selectedIndicesLength; index++) {
        //         var selectedIndex = this._arrayMapSelectedIndices[index];
        //         var context = this._oAnalyticalTable.getContextByIndex(selectedIndex);
        //         if (!context) {
        //             continue;
        //         }
        //         var object = context.getObject();
        //         var path = "/FSItemMappingCollectionItemSet";
        //         var isLast = (index === selectedIndicesLength - 1);
        //         var promise = this._createObjectPromise(path, {
        //             ChartOfAccounts: object.ChartOfAccounts,
        //             FSItemMappingId: object.FSItemMappingId,
        //             FSItemMappingRevision: object.FSItemMappingRevision,
        //             ConsolidationChartOfAccounts: object.ConsolidationChartOfAccounts
        //         }, isLast);
        //     }
        //     promise.then(function(response) {
        //         var fsItemMappingCollectionUUID = response.data.FSItemMappingCollectionUUID;
        //         var model = this.getOwnerComponent().getModel();
        //         var exportUrl = model.sServiceUrl + jQuery.sap.formatMessage(Constants.ExportMappingCollectionItemSetUrl, fsItemMappingCollectionUUID);
        //         sap.m.URLHelper.redirect(exportUrl, true);
        //         this._oFullPage.setBusy(false);
        //     }.bind(this), function(error) {
        //         that._oFullPage.setBusy(false);
        //     });
        // },        

        onToolbarAssignPress: function() { //지정 버튼 
            var t = this;
            var uiModel = this.getView().getModel("ui");
            this._aMapSelectedIndices = this.byId("analyticalTableSelectionPlugin").getSelectedIndices();
            var s = this._aMapSelectedIndices.length;
            if (s !== 1) {
                uiModel.setProperty("/assignBtnEnabled", false);
                return;
            }
            var i = this._aMapSelectedIndices[0];
            var c = this._oAnalyticalTable.getContextByIndex(i);
            if (!c) {
                return;
            }
            var o = c.getObject();
            var p = {
                ConsolidationChartOfAccounts: o.Ritclg,
                Unit: o.Rbunit,
                FSItemMappingId: o.MappingId,
                FSItemMappingRevision: o.Revision,
                objectId: o.Uuid
            };

            this.getModel("Para").setProperty("/", p)

            
            
            this._oFullPage.setBusy(false);
            this.getRouter().navTo("assignMapping", {
                objectId: p.objectId
            })
               
        },

        onToolbarShowLogPress: function() { //로그 조회 스탠다드 앱 이동
            // var t = this;
            // var g = function() {
            //     var d = new Date();
            //     var Y = d.getFullYear();
            //     var M = d.getMonth() + 1;
            //     var D = d.getDate();
            //     if (M >= 1 && M <= 9) {
            //         M = "0" + M;
            //     }
            //     if (D >= 0 && D <= 9) {
            //         D = "0" + D;
            //     }
            //     return Y.toString() + M.toString() + D.toString();
            // };
            // var p = {
            //     "LogObjectId": "FINCS",
            //     "LogObjectSubId": "FSITEMMAPPING",
            //     "PersKey": "pgdc0010.ShowLog",
            //     "DateFrom": g(),
            //     "DateTo": g()
            // };
            // this.storeCurrentAppState();
            // var o = function(e) {
            //     sap.m.MessageBox.error(t.getResourceBundle().getText("OUTBOUND_NAV_ERROR"));
            // };
            // this._oNavigationHandler.navigate("FinanceApplicationLog", "showList", p, this.getCurrentAppState(), o);
        },

        onToolbarDeletePress: function() {
            this._aResponseMessage = [];
            var d = this.getResourceBundle().getText("DeleteDialogTitle") || "Confirm Delete";
            var D = this.getResourceBundle().getText("DeleteDialogText");
            var s = this.getResourceBundle().getText("DeleteButtonText") || "Delete";
            var c = this.getResourceBundle().getText("CancelButtonText") || "Cancel";
            sap.m.MessageBox.warning(D, {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: d,
                actions: [s, c],
                emphasizedAction: s,
                styleClass: "sapUiSizeCompact",
                initialFocus: s,
                onClose: function(r) {
                    if (r === s) {
                        this._fnRemoveObjects();
                    }
                }
                .bind(this)
            });
        },
        
        
        onWithRevisionCheckBoxSelect: function(c) {
            var s = true;
            if (c.getMetadata === sap.m.CheckBox.getMetadata) {
                s = c.getSelected();
            } else if (c.getMetadata === sap.ui.base.Event.getMetadata) {
                s = c.getParameter("selected");
            }
            var uiModel = this.getView().getModel("ui");
            uiModel.setProperty("/createMappingContentHeight", s ? "480px" : "240px");
            uiModel.setProperty("/createMappingContentVisible", s);
        },

        onToolbarCreateMappingPress: function() {
            var uiModel = this.getView().getModel("ui");
            uiModel.setProperty("/fragmentOperate", Constants.FragmentOperateMap.CreateMapping);
            if (!this._oCreateMappingDialog) {
                this._oCreateMappingDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.CreateMappingDialogFragmentPath, this);
                this.getView().addDependent(this._oCreateMappingDialog);
            }
            this._oCreateMappingDialog.open();
            var w = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.mapping.checkbox.revision");
            w.setSelected(true);
            this.onWithRevisionCheckBoxSelect(w);
        },

        handleCreateMappingCancelPress: function() {
            this._destroyCreateMappingDialog();
        },

        _destroyCreateMappingDialog: function() {
            if (this._oCreateMappingDialog) {
                this.getView().removeDependent(this._oCreateMappingDialog);
                this._oCreateMappingDialog.close();
                this._oCreateMappingDialog.destroy(true);
                delete this._oCreateMappingDialog;
                this._oCreateMappingDialog = null;
            }
        },
        
        handleCreateMapping: function() {
            var uiModel = this.getView().getModel("ui");
            var s = this.getResourceBundle().getText("CreateMappingSuccessMessageText");
            var v = this.getView().getId();
            var m = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.MappingId");
            var M1 = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.mappingDescLo");
            var M2 = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.mappingDescGr");
            var b = [m, M1, M2];
            var V = false;
            jQuery.each(b, function(i, o) {
                V = this._validateInput(o) || V;
            }
            .bind(this));
            if (V) {
                return;
            }
            var c = this._createObjectPromise("/GRVCOA01", {
                MappingId: m.getValue(),
                MappingTextLo: M1.getValue(),
                MappingTextGr: M2.getValue(),
            }, true);
            c.then(function(r) {
                if (r.headers.msg) {
                    var p = jQuery.parseJSON(decodeURIComponent(r.headers.msg));
                    if (p[0] && p[0].msgty === "E") {
                        m.setValueState(sap.ui.core.ValueState.Error);
                        m.setValueStateText(p[0].msgtxt);
                        return;
                    }
                }
                if (r.statusCode === "201") {
                    if (this._oCreateMappingDialog) {
                        this._oCreateMappingDialog.close();
                    }
                    uiModel.setProperty("/MappingId", "");
                    uiModel.setProperty("/mappingDescLo", "");
                    uiModel.setProperty("/mappingDescGr", "");
                    this._clearCtrlState(b);
                    this._refreshTable();
                    sap.m.MessageToast.show(s);
                    this._destroyCreateMappingDialog();
                }
            }
            .bind(this), function(e) {});
        },
        handleCreateMappingWithRevision: function() {
            var uiModel = this.getView().getModel("ui");
            var s = this.getResourceBundle().getText("CreateMappingSuccessMessageText");
            var v = this.getView().getId();
            var m = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.MappingId");
            var M1 = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.mappingDescLo");
            var M2 = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.mappingDescGr");
            var c = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.select.cons.coa");
            var g = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.select.gl.coa");
            var r = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.revision");
            var R = sap.ui.core.Fragment.byId(v, "pgdc0010.create.mapping.input.revision.desc");
            var b = [m, M1, M2, c, g, r, R];
            var V = false;
        
            jQuery.each(b, function(i, d) {
                V = this._validateInput(d) || V;
            }.bind(this));
        
            if (V) {
                return;
            }
        
            var o1 = this._createObjectPromise("/GRVCOA01", {
                MappingId: m.getValue(),
                MappingTextLo: M1.getValue(),
                MappingTextGr: M2.getValue(),
            }, true);
        
            var o2 = this._createObjectPromise("/GRVCOA02", {
                MappingId : m.getValue(),
                Ritclg: c.getSelectedItem().getProperty("text"),
                Rbunit: g.getSelectedItem().getProperty("text"),
                Revision: r.getValue(),
                RevisionTextLo: R.getValue()
            }, true);
        
            Promise.all([o1, o2]).then(function(results) {
                var d1 = results[0];
                var d2 = results[1];
        
                var handleResponse = function(d) {
                    if (d.headers.msg) {
                        var p = jQuery.parseJSON(decodeURIComponent(d.headers.msg));
                        if (p[0] && p[0].msgty === "E") {
                            var e = {
                                "FSItemMappingId": m,
                                "FSItemMappingName": r,
                                "ConsolidationChartOfAccounts": c,
                                "ChartOfAccounts": g,
                                "FSItemMappingRevision": r,
                                "FSItemMappingRevisionText": R
                            };
                            var E = e[p[0].msgfd];
                            if (E) {
                                E.setValueState(sap.ui.core.ValueState.Error);
                                E.setValueStateText(p[0].msgtxt);
                            }
                            return false;
                        }
                    }
                    return true;
                };
        
                if (handleResponse(d1) && handleResponse(d2)) {
                    if (d1.statusCode === "201" && d2.statusCode === "201") {
                        if (this._oCreateMappingDialog) {
                            this._oCreateMappingDialog.close();
                        }
                        uiModel.setProperty("/MappingId", "");
                        uiModel.setProperty("/mappingDescLo", "");
                        uiModel.setProperty("/mappingDescGr", "");
                        uiModel.setProperty("/revision", "");
                        uiModel.setProperty("/revisionDescLo", "");
                        uiModel.setProperty("/revisionDescGr", "");
                        this._clearCtrlState(b);
                        this._refreshTable();
                        sap.m.MessageToast.show(s);
                        this._destroyCreateMappingDialog();
                    }
                }
            }.bind(this)).catch(function(e) {
                // 오류 처리
            });
        },
        
        handleCreateMappingPress: function(e) {
            this.getView().getModel().setSizeLimit(9999);
            var w = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.mapping.checkbox.revision");
            var W = w.getSelected();
            if (W) {
                this.handleCreateMappingWithRevision(e);
            } else {
                this.handleCreateMapping(e);
            }
        },
        onToolbarCreateRevisionPress: function() {
            this.getView().getModel().setSizeLimit(9999);
            var uiModel = this.getView().getModel("ui");
            uiModel.setProperty("/fragmentOperate", Constants.FragmentOperateMap.CreateRevision);
            uiModel.setProperty("/fragmentTitle", this.getResourceBundle().getText("CreateRevisionDialogTitle"));
            if (!this._oCreateRevisionDialog) {
                this._oCreateRevisionDialog = sap.ui.xmlfragment(this.getView().getId(), Constants.CreateRevisionDialogFragmentPath, this);
                this.getView().addDependent(this._oCreateRevisionDialog);
            }
            this._oCreateRevisionDialog.open();
            this._aMapSelectedIndices = this.byId("analyticalTableSelectionPlugin").getSelectedIndices();
            var selectedIndicesLength = this._aMapSelectedIndices.length;
            if (selectedIndicesLength < 1) {
                return;
            }
            var i = this._aMapSelectedIndices[0];
            var c = this._oAnalyticalTable.getContextByIndex(i);
            if (!c) {
                return;
            }
            var o = c.getObject();
            var m = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.MappingId");
            var b = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.cons.coa");
            var g = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.gl.coa");
            m.setSelectedKey(o.FSItemMappingId);
            b.setSelectedKey(o.ConsolidationChartOfAccounts);
            g.setSelectedKey(o.ChartOfAccounts);
        },
        handleCreateRevisionCancelPress: function() {
            if (this._oCreateRevisionDialog) {
                this.getView().removeDependent(this._oCreateRevisionDialog);
                this._oCreateRevisionDialog.close();
                this._oCreateRevisionDialog.destroy(true);
                delete this._oCreateRevisionDialog;
                this._oCreateRevisionDialog = null;
            }
        },
        handleCreateRevisionPress: function() {
            var uiModel = this.getView().getModel("ui");
            var s = this.getResourceBundle().getText("CreateRevisionSuccessMessageText");
            var m = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.MappingId");
            var c = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.cons.coa");
            var g = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.select.gl.coa");
            var r = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.input.revision");
            var R = sap.ui.core.Fragment.byId(this.getView().getId(), "pgdc0010.create.revision.input.revision.desc");
            var b = [m, c, g, r, R];
            var v = false;
            jQuery.each(b, function(i, o) {
                v = this._validateInput(o) || v;
            }
            .bind(this));
            if (v) {
                return;
            }
            var p = this._createObjectPromise("/GRVCOA02", {
                FSItemMappingId: m.getSelectedItem().getProperty("text"),
                ConsolidationChartOfAccounts: c.getSelectedItem().getProperty("text"),
                ChartOfAccounts: g.getSelectedItem().getProperty("text"),
                FSItemMappingRevision: r.getValue(),
                FSItemMappingRevisionText: R.getValue()
            }, true);
            p.then(function(o) {
                if (o.headers.msg.length !== 0) {
                    var P = jQuery.parseJSON(decodeURIComponent(o.headers.msg));
                    if (P[0] && P[0].msgty === "E") {
                        var d = {
                            "FSItemMappingId": m,
                            "FSItemMappingName": null,
                            "ConsolidationChartOfAccounts": c,
                            "ChartOfAccounts": g,
                            "FSItemMappingRevision": r,
                            "FSItemMappingRevisionText": R
                        };
                        var e = d[P[0].msgfd];
                        if (e) {
                            e.setValueState(sap.ui.core.ValueState.Error);
                            e.setValueStateText(P[0].msgtxt);
                        }
                        return;
                    }
                }
                if (o.statusCode === "201") {
                    if (this._oCreateRevisionDialog) {
                        this._oCreateRevisionDialog.close();
                    }
                    uiModel.setProperty("/revision", "");
                    uiModel.setProperty("/revisionDescLo", "");
                    this._clearCtrlState(b);
                    this._refreshTable();
                    sap.m.MessageToast.show(s);
                }
            }
            .bind(this), function(e) {}
            .bind(this));
        },
        handleOkPress: function() {
            var uiModel = this.getView().getModel("ui");
            var F = uiModel.getProperty("/fragmentOperate");
            if (F === Constants.FragmentOperateMap.CreateRevision) {
                this.handleCreateRevisionPress();
            }
            if (F === Constants.FragmentOperateMap.Duplicate) {
                this.handleDuplicatePress();
            }
        },
        handleCancelPress: function() {
            var uiModel = this.getView().getModel("ui");
            var F = uiModel.getProperty("/fragmentOperate");
            if (F === Constants.FragmentOperateMap.CreateRevision) {
                this.handleCreateRevisionCancelPress();
            }
            if (F === Constants.FragmentOperateMap.Duplicate) {
                this.handleDuplicateCancelPress();
            }
        },
        onPressNavigation: function(e) {
            this._oFullPage.setBusy(true);
            var p = e.getSource().getBindingContext().sPath;
            var oModel = this.getView().getModel();
            var selectedData = oModel.getProperty(p);
            var sUuid = selectedData.Uuid
            oModel.read(p, {
                success: function(d, r) {
                    this._oFullPage.setBusy(false);
                    this.getRouter().navTo("Detail", {
                        objectId: sUuid  
                    });
                }.bind(this),
                error: function(E) {
                    this._oFullPage.setBusy(false);
                    this.showErrorMessageBox(JSON.stringify(E));
                }.bind(this)
            });
        },
        
        onMapListRowSelectionChange: function(e) {
            this._aMapListSelectedIndices = this.byId("analyticalTableSelectionPlugin").getSelectedIndices();
            var s = this._aMapListSelectedIndices.length;
            this.getView().getModel("ui").setProperty("/exportBtnEnabled", (s > 0));
            this.getView().getModel("ui").setProperty("/deleteBtnEnabled", (s > 0));
            this.getView().getModel("ui").setProperty("/assignBtnEnabled", (s === 1));
            this.getView().getModel("ui").setProperty("/duplicateBtnEnabled", (s === 1));
        },
        _refreshTable: function() {
            this._oAnalyticalTable.getModel().refresh(true);
        },
        _fnRemoveObjects: function() {
            var t = this;
            this._iSuccessDeletedItems = 0;
            this._aMapSelectedIndices = this.byId("analyticalTableSelectionPlugin").getSelectedIndices();
            var s = this._aMapSelectedIndices.length;
            for (var i = 0; i < s; i++) {
                var b = t._aMapSelectedIndices[i];
                var c = t._oAnalyticalTable.getContextByIndex(b);
                if (!c) {
                    continue;
                }
                var p = c.getPath();
                var o = c.getObject();
                var r = (i === s - 1);
                var P = t._removeObjectPromise(p, o, r);
            }
            if (!P) {
                return;
            }
            P.then(function(m) {
                if (m.length > 0) {
                    t._showMessagePopover(t._parseMessage(m));
                }
                t.byId("analyticalTableSelectionPlugin").clearSelection();
                t.onToolbarRefreshPress();
            }, function(e) {});
        },

        _createObjectPromise: function(p, o, r) {
            var t = this;
            return new Promise(function(b, c) {
                var m = t.getView().getModel();
                m.create(p, o, {
                    success: function(d, R) {
                        if (b && R.statusCode === "201" && r) {
                            b(R);
                        }
                    },
                    error: function(e) {
                        c(e);
                    }
                });
            }
            );
        },

        _removeObjectPromise: function(p, o, r) {
            var t = this;
            return new Promise(function(b, c) {
                var m = t.getView().getModel();
                m.remove(p, {
                    success: function(d, R) {
                        if (R.statusCode === "204") {
                            if (R.headers.msg) {
                                var P = jQuery.parseJSON(decodeURIComponent(R.headers.msg));
                                for (var i = 0; i < P.length; i++) {
                                    t._aResponseMessage.push(P[i]);
                                }
                            }
                        }
                        if (b && r) {
                            b(t._aResponseMessage);
                        }
                    },
                    error: function(e) {
                        if (c && r) {
                            c();
                        }
                    }
                });
            }
            );
        },

        _validateInput: function(c) {
            function i(d) {
                return (d.trim().length < 1);
            }
            var v = sap.ui.core.ValueState.Success;
            var V = false;
            if (Select.getMetadata === c.getMetadata) {
                if (c.getSelectedKey().length === 0) {
                    v = sap.ui.core.ValueState.Error;
                    V = true;
                }
            }
            if (Input.getMetadata === c.getMetadata) {
                var b = c.getBinding("value");
                var d = c.getValue();
                if (i(d)) {
                    v = sap.ui.core.ValueState.Error;
                    V = true;
                } else {
                    try {
                        b.getType().validateValue(d);
                    } catch (e) {
                        v = sap.ui.core.ValueState.Error;
                        V = true;
                    }
                }
            }
            c.setValueState(v);
            return V;
        },

        _sortDefaultColumns: function() {
            var s = [new sap.ui.model.Sorter("FSItemMappingIsNew",true), new sap.ui.model.Sorter("ChartOfAccounts",false), new sap.ui.model.Sorter("ConsolidationChartOfAccounts",false), new sap.ui.model.Sorter("FSItemMappingId",false), new sap.ui.model.Sorter("FSItemMappingRevision",false)];
            var b = this._oAnalyticalTable.getBinding("rows");
            if (b && b.sort) {
                b.sort(s);
            }
        },
        _setValueWhenCopyRevision: function(o) {
            var t = this.byId("pgdc0010.duplicate.input.MappingId");
            var T = this.byId("pgdc0010.duplicate.input.cons.coa");
            var b = this.byId("pgdc0010.duplicate.input.gl.coa");
            var c = this.byId("pgdc0010.duplicate.input.revision");
            var d = this.byId("pgdc0010.duplicate.input.revision.desc");
            t.setText(o.FSItemMappingId);
            T.setText(jQuery.sap.formatMessage("{0} ({1})", [o.ConsolidationChartOfAccounts, o.ConsolidationChartOfAcctsText]));
            b.setText(jQuery.sap.formatMessage("{0} ({1})", [o.ChartOfAccounts, o.ChartOfAccountsName]));
            c.setText(o.FSItemMappingRevision);
            d.setText(o.FSItemMappingRevisionText);
        },

        _setDefaultGrouping: function() {
            var c = this._oAnalyticalTable.getColumns();
            var F = ["FSItemMappingId", "ConsolidationChartOfAccounts"];
            for (var i = 0; i < F.length; i++) {
                for (var j = 0; j < c.length; j++) {
                    if (c[j].getId().indexOf(F[i]) > 0) {
                        if (!c[j].getGrouped()) {
                            c[j].setGrouped(true);
                            c[j].setShowIfGrouped(true);
                        }
                    }
                }
            }
        },

        _parseMessage: function(M) {
            var s = this.getResourceBundle().getText("MessagePopoverSuccessText");
            var e = this.getResourceBundle().getText("MessagePopoverErrorText");
            var o = {
                msgty: "type",
                msgtxt: "subtitle"
            };
            var c = function(t) {
                if (t === "Select") {
                    return "Success";
                }
                if (t === "E") {
                    return "Error";
                }
                return "Error";
            };
            var b = function(t) {
                if (t === "Select") {
                    return s;
                }
                if (t === "E") {
                    return e;
                }
                return e;
            };
            var r = [];
            for (var i = 0; i < M.length; i++) {
                var m = {};
                if (M[i].msgty) {
                    m[o.msgty] = c(M[i].msgty);
                }
                if (M[i].msgtxt) {
                    m[o.msgtxt] = M[i].msgtxt;
                }
                m.title = c(M[i].msgty);
                m.description = "";
                r.push(m);
            }
            return r;
        },

        _showMessageStrip: function(m) {
            if (this._oMessageStrip) {
                this._oMessageStrip.destroy();
            }
            this._oMessageStrip = new sap.m.MessageStrip("messageStrip",{
                text: m.text,
                type: m.type,
                showCloseButton: true,
                showIcon: true
            });
            var v = this.byId("pgdc0010.overflowToolbar.vbox.ms");
            v.insertItem(this._oMessageStrip, 1);
            jQuery.sap.delayedCall(m.delay || 7000, this, function() {
                if (this._oMessageStrip) {
                    this._oMessageStrip.destroy();
                }
            });
        },

        _clearCtrlState: function(c) {
            jQuery.each(c, function(i, o) {
                o.setValueState(sap.ui.core.ValueState.None);
            });
        },

        _showMessagePopover: function(m) {
            var M = new sap.m.MessageItem({
                type: "{type}",
                title: "{title}",
                description: "{description}",
                subtitle: "{subtitle}",
                counter: "{counter}",
                markupDescription: "{markupDescription}",
                link: null
            });
            var o = new Json();
            o.setData(m);
            this.oMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                items: {
                    path: "/",
                    template: M
                }
            });
            this.oMessageView.setModel(o);
            this.oMessagePopoverDialog = new sap.m.Dialog({
                title: this.getResourceBundle().getText("MessagePopoverDialogTitle"),
                content: this.oMessageView,
                contentWidth: "700px",
                contentHeight: "400px",
                resizable: true,
                verticalScrolling: false,
                beginButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("CloseButtonText"),
                    press: function() {
                        this.getParent().close();
                    }
                })
            });
            this.oMessagePopoverDialog.open();
        },

        _callFunctionImport: function(c, F, uiModel) {
            return new Promise(function(b, r) {
                var m = c.getOwnerComponent().getModel();
                m.callFunction(F, {
                    method: "POST",
                    urlParameters: uiModel,
                    success: function(d, e) {
                        b(d);
                    },
                    error: function(e) {
                        r(e);
                    }
                });
            }
            );
        },

        getCurrentAppState: function() {
            var s = this.byId("pgdc0010.Worklist.smartFilterBar");
            var b = this.byId("pgdc0010.worklist.smarttable");
            var o = new SelectionVariant(JSON.stringify(s.getUiState().getSelectionVariant()));
            return {
                selectionVariant: o.toJSONString(),
                customData: {
                    tableSelectionVariant: JSON.stringify(b.getUiState().getSelectionVariant()),
                    tablePresentationVariant: JSON.stringify(b.getUiState().getPresentationVariant())
                }
            };
        },

        storeCurrentAppState: function() {
            var n = new NavigationHandler(this);
            var A = n.storeInnerAppStateAsync(this.getCurrentAppState());
            return A;
        },

        onSearch: function() {
            this.storeCurrentAppState();
        },

        onAfterApplyVariant: function() {
            this.storeCurrentAppState();
        },

        _handleInboundNavigation: function() {
            return new Promise(function(r) {
                var n = new NavigationHandler(this);
                var p = n.parseNavigation();
                p.done(function(A, s, b) {
                    if (b !== sap.ui.generic.app.navigation.service.NavType.initial) {
                        var h = A && A.bNavSelVarHasDefaultsOnly;
                        var o = new SelectionVariant(A.selectionVariant);
                        var c = o.getParameterNames().concat(o.getSelectOptionsPropertyNames());
                        var uiModel = {
                            replace: true,
                            strictMode: false
                        };
                        var d = new UIState({
                            selectionVariant: JSON.parse(A.selectionVariant)
                        });
                        var e = this.byId("pgdc0010.Worklist.smartFilterBar");
                        var g = this.byId("pgdc0010.worklist.smarttable");
                        this._waitUntilSmartFilterBarIsInitialized(e).then(function() {
                            for (var i = 0; i < c.length; i++) {
                                e.addFieldToAdvancedArea(c[i]);
                            }
                            if (!h || e.getCurrentVariantId() === "") {
                                e.clearVariantSelection();
                                e.clear();
                                e.setUiState(d, uiModel);
                            }
                            if (A.customData && A.customData.tablePresentationVariant) {
                                var t = new UIState({
                                    selectionVariant: JSON.parse(A.customData.tableSelectionVariant),
                                    presentationVariant: JSON.parse(A.customData.tablePresentationVariant)
                                });
                                g.setUiState(t);
                            }
                            if (!h) {
                                e.search();
                            }
                        });
                    }
                }
                .bind(this));
            }
            .bind(this));
        },
        
        _waitUntilSmartFilterBarIsInitialized: function(s) {
            return new Promise(function(r, b) {
                if (s.isInitialised()) {
                    r();
                } else {
                    s.attachInitialized(function() {
                        r();
                    });
                }
            }
            );
        }
    });
});


