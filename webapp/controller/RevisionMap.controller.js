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
        "sap/ui/generic/app/navigation/service/SelectionVariant",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/ui/core/Fragment",
        "sap/ui/comp/smartfilterbar/SmartFilterBar",
        "sap/m/MessageToast"
    ], function(
        BaseController,
        formatter,
        Input,
        Select,
        JSONModel,
        History,
        NavigationHandler,
        Constants,
        UIState,
        SelectionVariant,
        Filter,
        FilterOperator,
        MessageBox,
        Fragment,
        SmartFilterBar,
        MessageToast
    ) {
        "use strict";
  
      return BaseController.extend("pgdc0010.controller.RevisonMap", {
        formatter: formatter,
        _oEditDialog: null,
        _oFilter: {
            ConsolidationChartOfAccounts: undefined,
            Rbunit: undefined,
            FSItemMappingID: undefined
        },
        _errorState: {
            FiscalYearPeriod: false,
            ConsolidationVersion: false,
            ConsolidationChartOfAccounts: false,
            Rbunit: false,
            FSItemMappingID: false,
            FSItemMappingRevision: false
        },
        _globalParameter: {
            ConsolidationChartOfAccounts: undefined,
            ConsolidationVersion: undefined,
            FiscalPeriod: undefined,
            FiscalYear: undefined
        },
        _sMode: null,
        onInit: function() {
            // this._handleInboundNavigation();
            this._initModel();
            this.getRouter().getRoute("assignMapping").attachPatternMatched(this._onObjectMatched, this);
        },
        _initModel: function() {
            this._setEditable(false);
            this._setDeletable(false);
            var D = this.getOwnerComponent().getModel();
            var e = D.getDeferredGroups();
            e.push("doNotSubmitGroup");
            D.setDeferredGroups(e);
        },
        _onObjectMatched: function(e) {
            var t = this;
            var p = this.getModel("Para");
            // var P = this._getGlobalParameter
        
            t.prefillSmartFilterBar();
          
            if (p) {
             
                    var o = [];
                    o.ChartofAccounts = p.getProperty("/Unit");
                    o.ConsolidationChartOfAccounts = p.getProperty("/ConsolidationChartOfAccounts");
                    o.FSItemMappingID = p.getProperty("/FSItemMappingId");
                    o.FSItemMappingRevision = p.getProperty("/FSItemMappingRevision");
                    t._new(o);
                
            }
            if (!this.placeholderContainer) {
                this.placeholderContainer = e.getParameter("targetControl");
            } else if (!this.placeholderContainerIsActivelyShown) {
                this.placeholderContainer.hidePlaceholder();
            }
        },
        prefillSmartFilterBar: function() {
            var p = this.getModel("Para");
            if (!this.smartFilterBarPrefilled) {
                this.smartFilterBarPrefilled = true;
                var s = this.byId("smartFilterBar");
                var e = {
                    Fsmvs: "V01",
                    Ritclg: p.getProperty("/ConsolidationChartOfAccounts"),
                    Rbunit:  p.getProperty("/Unit"),

                };
                s.setFilterData(e, true);
               
                    this.rebindTableAfterInitialize();
              
            }
        },
        rebindTableAfterInitialize: function() {
            var t = this;
            var s = this.byId("pgdc0010.smartTable");
            if (!s.isInitialised()) {
                s.attachInitialise(function() {
                    t.handleWorklistTableRebind();
                });
            } else {
                t.handleWorklistTableRebind();
            }
        },
        handleWorklistTableRebind: function() {
            this.byId("smartFilterBar").attachFilterChange(this.handleFilterChange, this);
            this.byId("pgdc0010.smartTable").rebindTable();
        },
        handleFilterChange: function() {
            var s = this.byId("smartFilterBar");
            var o = this.byId("pgdc0010.smartTable");
            if (this.currentFilterString === s.getFilterDataAsString()) {
                o._showOverlay(false);
            }
        },
        onRowSelectionChange: function(e) {
            var t = this.byId("tableSelectionPlugin");
            var s = t.getSelectedIndices();
            if (s.length === 1) {
                this._setEditable(true);
                this._setDeletable(true);
            } else {
                this._setEditable(false);
                if (s.length === 0) {
                    this._setDeletable(false);
                } else {
                    this._setDeletable(true);
                }
            }
        },
        _setEditable: function(s) {
            var o = this.byId("btnEdit");
            var e = this.byId("pgdc0010.Worklist.EditCommand");
            o.setEnabled(s);
            e.setEnabled(s);
        },
        _setDeletable: function(s) {
            var o = this.byId("btnDelete");
            var e = this.byId("pgdc0010.Worklist.DeleteCommand");
            o.setEnabled(s);
            e.setEnabled(s);
        },
        _getGlobalParameter: function() {
            var t = this;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var oArgs = oRouter.getHashChanger().getHash().split("/")[1];
            var p = "/GRVCOA02(Uuid=guid'" + oArgs + "')";
        
            return new Promise(function(resolve, reject) {
                t.getModel().read(p, {
                    success: function(g) {
                        if (!g) {
                            resolve();
                            return;
                        }
                        t._globalParameter.ConsolidationChartOfAccounts = g.ConsolidationChartOfAccounts;
                        t._globalParameter.ConsolidationVersion = g.ConsolidationVersion;
                        t._globalParameter.FiscalPeriod = "0"
                        t._globalParameter.FiscalYear = "0000"
                        if (t._globalParameter.FiscalPeriod.length === 1) {
                            t._globalParameter.FiscalPeriod = "00" + t._globalParameter.FiscalPeriod;
                        } else if (t._globalParameter.FiscalPeriod.length === 2) {
                            t._globalParameter.FiscalPeriod = "0" + t._globalParameter.FiscalPeriod;
                        }
                        resolve();
                    },
                    error: function() {
                        reject();
                    }
                });
            });
        },
        
        onBeforeEditDialogOpen: function(e) {
            var n = this.getModel().createEntry("/GRVCOA03", {
                properties: {
                    Fsmvs: "",
                    Ritclg: "",
                    Rbunit: "",
                    FyearperiodTo: ""
                },
                groupId: "doNotSubmitGroup"
            });
            var o = n.getPath();
            e.getSource().bindObject({
                path: o
            });
        },
        attachChangeHandlerToInnerInputControl: function(e) {
            if (e.getSource().getEditable()) {
                e.getSource().getInnerControls()[0].attachChange(this._setSaveBtn.bind(this));
            }
        },
        _getParametersToDefaultFieldsOfCreateDialogWith: function() {
            var e = {};
            var s = this.byId("smartFilterBar");
            e.fiscalYearPeriod = s.getFilterData()["FiscalYearPeriod"];
            e.consolidationVersion = s.getFilterData()["ConsolidationVersion"];
            e.consolidationChartOfAccounts = this._extractFirstFilterValueFromMultiInputFilterInSmartFilterBar("ConsolidationChartOfAccounts");
            e.chartOfAccounts = this._extractFirstFilterValueFromMultiInputFilterInSmartFilterBar("Rbunit");
            e.cnsldtnFSItemMapping = this._extractFirstFilterValueFromMultiInputFilterInSmartFilterBar("MappingId");
            e.cnsldtnFSItemMappingRevision = this._extractFirstFilterValueFromMultiInputFilterInSmartFilterBar("CnsldtnFSItemMappingRevision");
            if (!e.fiscalYearPeriod) {
                e.fiscalYearPeriod = ("" + this._globalParameter.FiscalYear + this._globalParameter.FiscalPeriod);
            }
            if (!e.consolidationVersion) {
                e.consolidationVersion = this._globalParameter.ConsolidationVersion;
            }
            if (!e.consolidationChartOfAccounts) {
                e.consolidationChartOfAccounts = this._globalParameter.ConsolidationChartOfAccounts;
            }
            return e;
        },
        _extractFirstFilterValueFromMultiInputFilterInSmartFilterBar: function(k) {
            var s = this.byId("smartFilterBar");
            if (s.getFilterData()[k] && s.getFilterData()[k].items[0] && s.getFilterData()[k].items[0].key) {
                return s.getFilterData()[k].items[0].key;
            }
            return undefined;
        },
        onNew: function() {
            this._new();
        },
        _new: function(o) {
            this._setMode("new");
            var t = this.getResourceBundle().getText("NewAssign");
            var u = this.getView().getModel("ui");
            u.setProperty("/EditDialogTitle", t);
            var e = "Fra_EditDialog";
          
            this._oEditDialog = sap.ui.xmlfragment(e, "pgdc0010.view.fragment.AssignRevision", this);
            this.getView().addDependent(this._oEditDialog);
            
            var i = this._getInputControl();
            this._oEditDialog.open();
            if (o) {
                i.ConsolidationChartOfAccounts.setValue(o.ConsolidationChartOfAccounts);
                // i.ConsolidationVersion.setValue("");
                // i.FiscalYearPeriod.setProperty("value", "" + );
                i.FSItemMappingID.setValue(o.FSItemMappingID);
                i.FSItemMappingRevision.setValue(o.FSItemMappingRevision);
                i.Rbunit.setValue(o.ChartofAccounts);
                i.FiscalYearPeriod.fireChange();
                i.ConsolidationVersion.fireChange();
                i.ConsolidationChartOfAccounts.fireChange();
                i.FSItemMappingID.fireChange();
                i.FSItemMappingRevision.fireChange();
                i.Rbunit.fireChange();
            } else {
                var g = this._getParametersToDefaultFieldsOfCreateDialogWith();
                // i.FiscalYearPeriod.setProperty("value", g.fiscalYearPeriod);
                i.ConsolidationVersion.setValue(g.consolidationVersion);
                i.ConsolidationChartOfAccounts.setValue(g.consolidationChartOfAccounts);
                i.Rbunit.setValue(g.chartOfAccounts);
                i.FSItemMappingID.setValue(g.cnsldtnFSItemMapping);
                i.FSItemMappingRevision.setValue(g.cnsldtnFSItemMappingRevision);
                i.FiscalYearPeriod.fireChange();
                i.ConsolidationVersion.fireChange();
                i.ConsolidationChartOfAccounts.fireChange();
                i.Rbunit.fireChange();
                i.FSItemMappingID.fireChange();
                i.FSItemMappingRevision.fireChange();
            }
            this._setSaveBtn();
        },
        onEdit: function(e) {
            var t = this;
            M.show(t.getResourceBundle().getText("EditMessage"), {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: t.getResourceBundle().getText("ConfirmEdit"),
                actions: [t.getResourceBundle().getText("Edit"), t.getResourceBundle().getText("Cancel")],
                emphasizedAction: t.getResourceBundle().getText("Edit"),
                onClose: function(A) {
                    if ((A === t.getResourceBundle().getText("Edit")) && A !== undefined) {
                        t._Edit();
                    }
                }
            });
        },
        _Edit: function() {
            var t = this.byId("tableSelectionPlugin");
            var s = t.getSelectedIndices()[0];
            this.etagForCurrentlyEditedItemPromise = this._getETagForItemWithIndex(s);
            var i = this._getSelectedItems()[0];
            this._setMode("edit");
            var T = this.getResourceBundle().getText("EditAssign");
            var u = this.getView().getModel("ui");
            u.setProperty("/EditDialogTitle", T);
            var e = "Fra_EditDialog";
            this._oEditDialog = sap.ui.xmlfragment(e, "pgdc0010.pgdc0010view.fragment.EditDialog", this);
            this.getView().addDependent(this._oEditDialog);
            var I = this._getInputControl();
            this._oEditDialog.open();
            I.ConsolidationVersion.setValue(i.ConsolidationVersion);
            I.ConsolidationChartOfAccounts.setValue(i.ConsolidationChartOfAccounts);
            I.Rbunit.setValue(i.Rbunit);
            I.FiscalYearPeriod.setProperty("value", i.FromFiscalYearPeriod);
            I.FSItemMappingID.setValue(i.FSItemMappingID);
            I.FSItemMappingRevision.setValue(i.FSItemMappingRevision);
            I.ConsolidationVersion.setEditable(false);
            I.ConsolidationChartOfAccounts.setEditable(false);
            I.Rbunit.setEditable(false);
            I.FiscalYearPeriod.setEditable(false);
            this._fireChecks(I);
        },
        onDelete: function() {
            var t = this;
            MessageBox.show(t.getResourceBundle().getText("DeleteMessage"), {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: t.getResourceBundle().getText("ConfirmDelete"),
                actions: [t.getResourceBundle().getText("Delete"), t.getResourceBundle().getText("Cancel")],
                emphasizedAction: t.getResourceBundle().getText("Delete"),
                onClose: function(A) {
                    if ((A === t.getResourceBundle().getText("Delete")) && A !== undefined) {
                        var T = t.byId("tableSelectionPlugin");
                        var s = T.getSelectedIndices();
                        t._deleteItemsByIndex(s);
                    }
                }
            });
        },
        _getSelectedItems: function() {
            var t = this.byId("tableSelectionPlugin");
            var s = t.getSelectedIndices();
            var T = this.byId("pgdc0010.table");
            var e = [];
            s.forEach(function(i) {
                var o = T.getContextByIndex(i);
                var r = {
                    Uuid: o.getProperty("Uuid"),
                    Fsmvs: o.getProperty("Fsmvs"),
                    Ritclg: o.getProperty("Ritclg"),
                    Rbunit: o.getProperty("Rbunit"),
                    FyearperiodFr: o.getProperty("FyearperiodFr"),
                    MappingId: o.getProperty("MappingId"),
                    Revision: o.getProperty("Revision")
                };
                e.push(r);
            });
            return e;
        },
        _unSelectItem: function() {
            var t = this.byId("tableSelectionPlugin");
            t.clearSelection();
        },
        _clearFilter: function() {
            this._oFilter.ConsolidationChartOfAccounts = undefined;
            this._oFilter.Rbunit = undefined;
            this._oFilter.FSItemMappingID = undefined;
        },
        _setMode: function(v) {
            switch (v) {
            case "new":
                this._sMode = 0;
                break;
            case "edit":
                this._sMode = 1;
                break;
            }
        },
        onBeforeRebind: function(e) {
            this._unSelectItem();
            var o = e.getParameter("bindingParams");
            var s = o.sorter;
            if (s.length === 0) {
                s.push(new sap.ui.model.Sorter("Fsmvs",false));
                s.push(new sap.ui.model.Sorter("Ritclg",false));
                s.push(new sap.ui.model.Sorter("Rbunit",false));
                s.push(new sap.ui.model.Sorter("FyearperiodTo",false));
            } else {
                for (var i = 0; i < s.length; i++) {
                    if (s[i].sPath === "FyearperiodTo") {
                        s[i].sPath = "FyearperiodTo";
                    }
                }
            }
            o.sorter = s;
            this.applyFromToSnapshotFilter(e);
            this.placeholderContainerIsActivelyShown = true;
            o.events.dataReceived = function() {
                if (this.placeholderContainer) {
                    this.placeholderContainer.hidePlaceholder();
                    this.placeholderContainerIsActivelyShown = false;
                }
            }
            .bind(this);
            var g = this.byId("smartFilterBar");
            this.currentFilterString = g.getFilterDataAsString();
        },
        applyFromToSnapshotFilter: function(e) {
            var o = e.getParameter("bindingParams");
            var s = this.byId("smartFilterBar");
            var g = "FyearperiodTo";
            var h = s.getFilterData()[g];
            if (h) {
                var i = this.createFromToFilter(h);
                if (!o.filters || !o.filters[0] || !o.filters[0].aFilters) {
                    o.filters = [];
                } else {
                    this.removeOriginalFilterFromFiltersArray(o.filters, g);
                }
                o.filters.push(i);
            }
        },
        removeOriginalFilterFromFiltersArray: function(e, p) {
            var t = this;
            for (var i = (e.length - 1); i >= 0; i--) {
                var g = e[i];
                if (g && g.sPath && g.sPath === p) {
                    e.splice(i, 1);
                }
            }
            e.forEach(function(h) {
                if (Array.isArray(h.aFilters)) {
                    t.removeOriginalFilterFromFiltersArray(h.aFilters, p);
                }
            });
        },
        createFromToFilter: function(e) {
            return new F({
                filters: [new F({
                    path: "FromFiscalYearPeriod",
                    operator: a.LE,
                    value1: e
                }), new F({
                    path: "ToFiscalYearPeriod",
                    operator: a.GE,
                    value1: e
                })],
                and: true
            });
        },
        onCancelPress: function(e) {
            if (this._oEditDialog) {
                this._oEditDialog.close();
                this._oEditDialog.destroy();
            }
        },
        _getInputControl: function() {
            var C = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationVersion");
            var o = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationChartOfAccounts");
            var e = Fragment.byId("Fra_EditDialog", "pgdc0010.Rbunit");
            var g = Fragment.byId("Fra_EditDialog", "pgdc0010.FiscalYearPeriod");
            var h = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingID");
            var i = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision");
            var j = {
                ConsolidationVersion: C,
                ConsolidationChartOfAccounts: o,
                Rbunit: e,
                FiscalYearPeriod: g,
                FSItemMappingID: h,
                FSItemMappingRevision: i
            };
            return j;
        },
        _setSaveBtn: function() {
            var s = Fragment.byId("Fra_EditDialog", "pgdc0010.button.save");
            if (this._isFormContentValid()) {
                s.setEnabled(true);
            } else {
                s.setEnabled(false);
            }
        },
        _isFormContentValid: function() {
            function e(i) {
                if (i.ConsolidationVersion.getValue() && i.ConsolidationChartOfAccounts.getValue() && i.Rbunit.getValue() && i.FiscalYearPeriod.getBinding("value").getValue() && i.FSItemMappingID.getValue() && i.FSItemMappingRevision.getValue()) {
                    return true;
                } else {
                    return false;
                }
            }
            function g(i) {
                var s = "Success";
                var n = "None";
                if (i.ConsolidationVersion.getValueState() === s && i.ConsolidationChartOfAccounts.getValueState() === s && i.Rbunit.getValueState() === s && (i.FiscalYearPeriod.getValueState() === s || i.FiscalYearPeriod.getValueState() === n) && i.FSItemMappingID.getValueState() === s && i.FSItemMappingRevision.getValueState() === s) {
                    return true;
                } else {
                    return false;
                }
            }
            var i = this._getInputControl();
            return e(i) && g(i);
        },
        onSavePress: function() {
            var t = this;
            function s(r) {
                setTimeout(function() {
                    if (t.getModel("ui").getProperty("/isValidationRunning")) {
                        s(r);
                    } else if (t._isFormContentValid()) {
                        t._executeSave();
                        r();
                    } else {
                        r();
                    }
                }, 10);
            }
            return new Promise(function(r) {
                s(r);
            }
            );
        },
        _executeSave: function() {
            var i = this._getInputControl();
            var C = i.ConsolidationVersion.getValue();
            var s = i.ConsolidationChartOfAccounts.getValue();
            var e = i.Rbunit.getValue();
            var g = i.FiscalYearPeriod.getBinding("value").getValue();
            var h = i.FSItemMappingID.getValue();
            var j = i.FSItemMappingRevision.getValue();
            var A = {
                Fsmvs: C,
                Ritclg: s,
                Rbunit: e,
                FyearperiodTo: g,
                MappingId: h,
                Revision: j
            };
            var k = [];
            k.push(A);
            this._Save(k);
            if (this._oEditDialog) {
                this._oEditDialog.close();
                this._oEditDialog.destroy();
            }
        },
        _replace32DigitsETagInSADLHeaderETag: function(e, g) {
            var s = e.split("~")[0];
            var h = s + "~" + g + "'\"";
            return h;
        },
        _getETagForItemWithIndex: function(i) {
            return new Promise(function(r, e) {
                var g;
                var s = this.byId("pgdc0010.smartTable");
                var h = s && s.getTable() && s.getTable().getContextByIndex(i);
                if (h && (h.getProperty("ETag") || h.getProperty("ETag") === "")) {
                    g = h.getProperty("ETag");
                } else {
                    e();
                    return;
                }
                if (h.getPath()) {
                    var n = h.getPath();
                    var p = "/C_CnsldtnFSItemMappingAssgmt";
                    var j = "/C_CnsldtnFSItemMappingAssgmtTP" + n.substring(p.length);
                    this.getModel().read(j, {
                        success: function(R) {
                            var k = R.__metadata.etag;
                            var l = this._replace32DigitsETagInSADLHeaderETag(k, g);
                            r(l);
                        }
                        .bind(this),
                        error: function() {
                            e();
                        }
                    });
                } else {
                    e();
                }
            }
            .bind(this));
        },
        _getKeyPropertiesFromItemByIndex: function(i) {
            var s = this.byId("pgdc0010.smartTable");
            var k = {};
            var e = s && s.getTable() && s.getTable().getContextByIndex(i);
            if (e) {
                k.Uuid = e.getProperty("Uuid");
                // k.Rbunit = e.getProperty("Rbunit");
                // k.ConsolidationVersion = e.getProperty("ConsolidationVersion");
                // k.FromFiscalYearPeriod = e.getProperty("FromFiscalYearPeriod");
            }
            return k;
        },
        _deleteItemsByIndex: function(i) {
            var p = [];
            var t = this;
            var D = this.getModel();
            i.forEach(function(e) {
                var k = t._getKeyPropertiesFromItemByIndex(e);
                var g = D.createKey("/GRVCOA03", k);
                p.push(new Promise(function(r) {
                        D.remove(g, {
                            success: function() {
                                r();
                            },
                            error: function(R) {
                                t._SaveError(R);
                            }
                        });
                        D.refresh();
                }
                ));
            });
            Promise.all(p).then(function() {
                MessageBox.show(t.getResourceBundle().getText("AssignmentsDeleted", p.length));
            });
        },
        _SaveSuccess: function() {
            this.getModel().refresh();
        },
        _SaveError: function(r) {
            var R = r.responseText;
            var e = JSON.parse(R);
            var m = e.error.message.value;
            M.error(m, {
                title: "Error"
            });
        },

        _CalculateToPeriod(records, newRecord) {
            records.push(newRecord);
            records.sort((a, b) => a.FyearperiodFr.localeCompare(b.FyearperiodFr));
        
            for (let i = 0; i < records.length; i++) {
                if (i < records.length - 1) {
                    let nextFromFiscalYearPeriod = records[i + 1].FyearperiodFr;
                    let year = parseInt(nextFromFiscalYearPeriod.slice(0, 4), 10);
                    let month = parseInt(nextFromFiscalYearPeriod.slice(4, 6), 10);
        
                    month -= 1;
                    if (month === 0) {
                        month = 12;
                        year -= 1;
                    }
        
                    records[i].FyearperiodTo = year.toString().padStart(4, '0') + month.toString().padStart(2, '0');
                } else {
                    records[i].FyearperiodTo = '9999012';
                }
            }
        
            return records;
        },

        _Save: function(A) {
            var t = this;
            switch (this._sMode) {
            case 0:
                this.getModel().create("/GRVCOA03", A[0], {
                    success: function() {
                        MessageBox.show(this.getResourceBundle().getText("AssignmentCreated"));
                        this._SaveSuccess();
                    }
                    .bind(this),
                    error: t._SaveError.bind(t)
                });
                break;
            case 1:
                var D = this.getModel();
                var k = {
                    ConsolidationChartOfAccounts: A[0].ConsolidationChartOfAccounts,
                    Rbunit: A[0].Rbunit,
                    ConsolidationVersion: A[0].ConsolidationVersion,
                    FromFiscalYearPeriod: A[0].FromFiscalYearPeriod
                };
                var p = D.createKey("/GRVCOA03", k);
                this.etagForCurrentlyEditedItemPromise.then(function(e) {
                    this.getModel().update(p, A[0], {
                        refreshAfterChange: true,
                        success: function() {
                            MessageBox.show(this.getResourceBundle().getText("AssignmentSaved"));
                            this._SaveSuccess();
                        }
                        .bind(this),
                        error: this._SaveError.bind(this),
                        eTag: e
                    });
                }
                .bind(this));
                break;
            }
            this._unSelectItem();
            this._clearFilter();
        },
        _fireChecks: function(i) {
            i.FiscalYearPeriod.fireChange();
            i.ConsolidationVersion.fireChange();
            i.ConsolidationChartOfAccounts.fireChange();
            i.Rbunit.fireChange();
            i.FSItemMappingID.fireChange();
            i.FSItemMappingRevision.fireChange();
        },
        _ofilterChanged: function(o) {
            if (Object.keys(o).indexOf("ConsolidationChartOfAccounts") >= 0) {
                this._oFilter.ConsolidationChartOfAccounts = o.ConsolidationChartOfAccounts;
            }
            if (Object.keys(o).indexOf("Rbunit") >= 0) {
                this._oFilter.Rbunit = o.Rbunit;
            }
            if (Object.keys(o).indexOf("FSItemMappingID") >= 0) {
                this._oFilter.FSItemMappingID = o.FSItemMappingID;
            }
        },
        handleConsolidationVersionChange: function(e) {
            this.getModel("ui").setProperty("/isValidationRunning", true);
            var s = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationVersion");
            var g = s.getValue().toUpperCase();
            s.setValue(g);
            var m = this.getModel();
            var p = "/VH_FSMVS('" + encodeURIComponent(g) + "')";
            var t = this;
            m.read(p, {
                groupId: "handleConsolidationVersionChange",
                success: function(h) {
                    s.setValueState("Success");
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                },
                error: function() {
                    s.setValueState("Error");
                    s.setValueStateText(t.getResourceBundle().getText("ValidValue"));
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                }
            });
        },
        handleConsolidationChartOfAccountsChange: function(e) {
            this.getModel("ui").setProperty("/isValidationRunning", true);
            var C = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationChartOfAccounts");
            var s = C.getValue().toUpperCase();
            C.setValue(s);
            var t = this;
            var m = this.getModel();
            if (!s) {
                C.setValueState("None");
                t._ofilterChanged({
                    ConsolidationChartOfAccounts: s
                });
                t._setSaveBtn();
                t.getModel("ui").setProperty("/isValidationRunning", false);
                return;
            }
            var p = "/VH_RITCLG('" + encodeURIComponent(s) + "')";
            m.read(p, {
                groupId: "handleCOAChange",
                success: function(g) {
                    C.setValueState("Success");
                    t._ofilterChanged({
                        ConsolidationChartOfAccounts: s
                    });
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                    Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision").fireChange();
                },
                error: function() {
                    C.setValueState("Error");
                    C.setValueStateText(t.getResourceBundle().getText("ValidValue"));
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                }
            });
        },
        handleUnitChange: function(e) {
            this.getModel("ui").setProperty("/isValidationRunning", true);
            var C = Fragment.byId("Fra_EditDialog", "pgdc0010.Rbunit");
            var s = C.getValue().toUpperCase();
            C.setValue(s);
            var t = this;
            var m = this.getModel();
            if (!s) {
                C.setValueState("None");
                t._ofilterChanged({
                    Rbunit: s
                });
                t._setSaveBtn();
                t.getModel("ui").setProperty("/isValidationRunning", false);
                return;
            }
            var p = "/VH_RBUNIT('" + encodeURIComponent(s) + "')";
            m.read(p, {
                groupId: "handleChartOfAccountsChange",
                success: function(g) {
                    C.setValueState("Success");
                    t._ofilterChanged({
                        Rbunit: s
                    });
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                    Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision").fireChange();
                },
                error: function() {
                    C.setValueState("Error");
                    C.setValueStateText(t.getResourceBundle().getText("ValidValue"));
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                }
            });
        },
        handleFSItemMappingIDChange: function(e) {
            this.getModel("ui").setProperty("/isValidationRunning", true);
            var o = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingID");
            var s = o.getValue().toUpperCase();
            o.setValue(s);
            var t = this;
            var m = this.getModel();
            if (!s) {
                o.setValueState("None");
                t._ofilterChanged({
                    FSItemMappingID: s
                });
                t._setSaveBtn();
                t.getModel("ui").setProperty("/isValidationRunning", false);
                return;
            }
            var p = "/VH_MAPPING_ID('" + encodeURIComponent(s) + "')";
            m.read(p, {
                groupId: "handleFSItemMappingIDChange",
                success: function(g) {
                    o.setValueState("Success");
                    t._ofilterChanged({
                        FSItemMappingID: s
                    });
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                    Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision").fireChange();
                },
                error: function() {
                    o.setValueState("Error");
                    o.setValueStateText(t.getResourceBundle().getText("ValidValue"));
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                }
            });
        },
        handleFSItemMappingRevisionChange: function(e) {
            this.getModel("ui").setProperty("/isValidationRunning", true);
            var C = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationChartOfAccounts");
            var o = Fragment.byId("Fra_EditDialog", "pgdc0010.Rbunit");
            var g = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingID");
            var h = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision");
            var s = o.getValue().toUpperCase();
            var i = C.getValue().toUpperCase();
            var j = g.getValue().toUpperCase();
            var k = h.getValue().toUpperCase();
            h.setValue(k);
            var t = this;
            var m = this.getModel();
            if (!k) {
                h.setValueState("None");
                t._setSaveBtn();
                t.getModel("ui").setProperty("/isValidationRunning", false);
                return;
            }
            var p = `/VH_REVISION(Revision='${k}',Ritclg='${i}',Rbunit='${s}',MappingId='${j}')`;
            m.read(p, {
                groupId: "handleFSItemMappingRevisionChange",
                success: function(l) {
                    h.setValueState("Success");
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                },
                error: function() {
                    h.setValueState("Error");
                    h.setValueStateText(t.getResourceBundle().getText("ValidValue"));
                    t._setSaveBtn();
                    t.getModel("ui").setProperty("/isValidationRunning", false);
                }
            });
        },
        _hideFilterEntryInColumnHeaderMenuFor: function(s) {
            var C = s.getTable().getColumns();
            C.forEach(function(o) {
                o.setProperty("showFilterMenuEntry", false);
            });
        },
        _openDialog: function(v) {
            v.addStyleClass("sapUiSizeCompact");
            v.setContentWidth("50%");
            v.setVerticalScrolling(false);
            v.open();
        },
        handleConsolidationVersionVHOpen: function(e) {
            var m = this.getView().getModel();
            var v = this._createConsolidationVersionVHDialog(m);
            v.setModel(this.getView().getModel());
            var s = v.getFilterBar();
            this._waitUntilSmartFilterBarIsInitialized(s).then(function() {
                s.search();
                this._openDialog(v);
            }
            .bind(this));
        },
        _createConsolidationVersionVHDialog: function(m) {
            var t = this;
            var v = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: m.getProperty("/#VH_FSMVSType/Fsmvs/@sap:label"),
                modal: true,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Fsmvs",
                filterBar: new SmartFilterBar("ConsolidationVersionVHSmartFilterBar",{
                    advancedMode: true,
                    entitySet: "VH_FSMVS",
                    enableBasicSearch: true,
                    filterBarExpanded: false
                }),
                ok: function(C) {
                    var i = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationVersion");
                    if (C.getParameter("tokens")) {
                        var T = C.getParameter("tokens")[0];
                        i.setValue(T.getKey());
                    }
                    this.close();
                    i.fireChange();
                },
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            });
            var s = new sap.ui.comp.smarttable.SmartTable("ConsolidationVersionVHSmartTable",{
                smartFilterId: "ConsolidationVersionVHSmartFilterBar",
                entitySet: "VH_FSMVS",
                initiallyVisibleFields: "Fsmvs",
                useExportToExcel: false,
                useVariantManagement: false,
                useTablePersonalisation: false,
                beforeRebindTable: function(e) {
                    e.getParameter("bindingParams").events.dataReceived = function() {
                        v.update();
                    }
                    ;
                }
            });
            s.attachInitialise(function() {
                t._hideFilterEntryInColumnHeaderMenuFor(s);
            });
            v.setTable(s);
            return v;
        },
        handleConsolidationChartOfAccountsVHOpen: function(e) {
            var m = this.getView().getModel();
            var v = this._createConsolidationChartOfAccountsVHDialog(m);
            v.setModel(this.getView().getModel());
            var s = v.getFilterBar();
            this._waitUntilSmartFilterBarIsInitialized(s).then(function() {
                s.search();
                this._openDialog(v);
            }
            .bind(this));
            this._openDialog(v);
        },
        _createConsolidationChartOfAccountsVHDialog: function(m) {
            var t = this;
            var v = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: m.getProperty("/#VH_RITCLGType/Ritclg/@sap:label"),
                modal: true,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Ritclg",
                filterBar: new SmartFilterBar("ConsChartOfAccountsVHSmartFilterBar",{
                    advancedMode: true,
                    entitySet: "VH_RITCLG",
                    enableBasicSearch: true,
                    filterBarExpanded: false
                }),
                ok: function(C) {
                    var i = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationChartOfAccounts");
                    if (C.getParameter("tokens")) {
                        var T = C.getParameter("tokens")[0];
                        i.setValue(T.getKey());
                    }
                    this.close();
                    i.fireChange();
                },
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            });
            var s = new sap.ui.comp.smarttable.SmartTable("ConsChartOfAccountsVHSmartTable",{
                smartFilterId: "ConsChartOfAccountsVHSmartFilterBar",
                entitySet: "VH_RITCLG",
                initiallyVisibleFields: "Ritclg",
                useExportToExcel: false,
                useVariantManagement: false,
                useTablePersonalisation: false,
                beforeRebindTable: function(e) {
                    e.getParameter("bindingParams").events.dataReceived = function() {
                        v.update();
                    }
                    ;
                }
            });
            s.attachInitialise(function() {
                t._hideFilterEntryInColumnHeaderMenuFor(s);
            });
            v.setTable(s);
            return v;
        },
        handleUnitVHOpen: function(e) {
            var m = this.getView().getModel();
            var v = this._createUnitVHDialog(m);
            v.setModel(this.getView().getModel());
            var s = v.getFilterBar();
            this._waitUntilSmartFilterBarIsInitialized(s).then(function() {
                s.search();
                this._openDialog(v);
            }
            .bind(this));
        },
        _createUnitVHDialog: function(m) {
            var t = this;
            var v = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: m.getProperty("/#VH_RBUNITType/Rbunit/@sap:label"),
                modal: true,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Rbunit",
                filterBar: new SmartFilterBar("GLChartOfAccountsVHSmartFilterBar",{
                    advancedMode: true,
                    entitySet: "VH_RBUNIT",
                    enableBasicSearch: true,
                    filterBarExpanded: false
                }),
                ok: function(C) {
                    var o = Fragment.byId("Fra_EditDialog", "pgdc0010.Rbunit");
                    if (C.getParameter("tokens")) {
                        var T = C.getParameter("tokens")[0];
                        o.setValue(T.getKey());
                    }
                    this.close();
                    o.fireChange();
                },
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            });
            var s = new sap.ui.comp.smarttable.SmartTable("GLChartOfAccountsVHSmartTable",{
                smartFilterId: "GLChartOfAccountsVHSmartFilterBar",
                entitySet: "VH_RBUNIT",
                initiallyVisibleFields: "Rbunit",
                useExportToExcel: false,
                useVariantManagement: false,
                useTablePersonalisation: false,
                beforeRebindTable: function(e) {
                    e.getParameter("bindingParams").events.dataReceived = function() {
                        v.update();
                    }
                    ;
                }
            });
            s.attachInitialise(function() {
                t._hideFilterEntryInColumnHeaderMenuFor(s);
            });
            v.setTable(s);
            return v;
        },
        handleFSItemMappingIDVHOpen: function(e) {
            var m = this.getView().getModel();
            var v = this._createFSItemMappingIDVHDialog(m);
            v.setModel(this.getView().getModel());
            var s = v.getFilterBar();
            this._waitUntilSmartFilterBarIsInitialized(s).then(function() {
                s.search();
                this._openDialog(v);
            }
            .bind(this));
        },
        _createFSItemMappingIDVHDialog: function(m) {
            var t = this;
            var v = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: m.getProperty("/#VH_MAPPING_IDType/MappingId/@sap:label"),
                modal: true,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                key: "MappingId",
                descriptionKey: "MappingTextLo",
                filterBar: new SmartFilterBar("MappingIDVHSmartFilterBar",{
                    advancedMode: true,
                    entitySet: "VH_MAPPING_ID",
                    enableBasicSearch: true,
                    filterBarExpanded: false
                }),
                ok: function(C) {
                    var o = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingID");
                    if (C.getParameter("tokens")) {
                        var T = C.getParameter("tokens")[0];
                        o.setValue(T.getKey());
                    }
                    this.close();
                    o.fireChange();
                },
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            });
            var s = new sap.ui.comp.smarttable.SmartTable("MappingIDVHSmartTable",{
                smartFilterId: "MappingIDVHSmartFilterBar",
                entitySet: "VH_MAPPING_ID",
                initiallyVisibleFields: "MappingId",
                useExportToExcel: false,
                useVariantManagement: false,
                useTablePersonalisation: false,
                beforeRebindTable: function(e) {
                    e.getParameter("bindingParams").events.dataReceived = function() {
                        v.update();
                    }
                    ;
                }
            });
            s.attachInitialise(function() {
                t._hideFilterEntryInColumnHeaderMenuFor(s);
            });
            v.setTable(s);
            return v;
        },
        handleFSItemMappingRevisionVHOpen: function(e) {
            var m = this.getView().getModel();
            var v = this._createFSItemMappingRevisionVHDialog(m);
            v.setModel(this.getView().getModel());
            var o = {};
            if (this._oFilter.ConsolidationChartOfAccounts) {
                o["ConsolidationChartOfAccounts"] = {
                    items: [{
                        key: this._oFilter.ConsolidationChartOfAccounts,
                        text: this._oFilter.ConsolidationChartOfAccounts
                    }]
                };
            }
            if (this._oFilter.Rbunit) {
                o["Rbunit"] = {
                    items: [{
                        key: this._oFilter.Rbunit,
                        text: this._oFilter.Rbunit
                    }]
                };
            }
            if (this._oFilter.FSItemMappingID) {
                o["MappingId"] = {
                    items: [{
                        key: this._oFilter.FSItemMappingID,
                        text: this._oFilter.FSItemMappingID
                    }]
                };
            }
            var s = v.getFilterBar();
            this._waitUntilSmartFilterBarIsInitialized(s).then(function() {
                s.setFilterData(o);
                s.search();
                this._openDialog(v);
            }
            .bind(this));
        },
        _createFSItemMappingRevisionVHDialog: function(m) {
            var t = this;
            var v = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                title: m.getProperty("/#VH_REVISIONType/Revision/@sap:label"),
                modal: true,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                key: "Revision",
                filterBar: new SmartFilterBar("MappingRevisionVHSmartFilterBar",{
                    advancedMode: true,
                    entitySet: "VH_REVISION",
                    enableBasicSearch: true,
                    filterBarExpanded: false
                }),
                ok: function(C) {
                    var o = Fragment.byId("Fra_EditDialog", "pgdc0010.ConsolidationChartOfAccounts");
                    var e = Fragment.byId("Fra_EditDialog", "pgdc0010.Rbunit");
                    var g = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingID");
                    var h = Fragment.byId("Fra_EditDialog", "pgdc0010.FSItemMappingRevision");
                    if (C.getParameter("tokens")) {
                        var T = C.getParameter("tokens")[0];
                        h.setValue(T.getKey());
                        var D = T.getCustomData();
                        var V = D[0];
                        if (t._sMode === 0) {
                            o.setValue(V.getValue().Ritclg);
                            e.setValue(V.getValue().Rbunit);
                        }
                        g.setValue(V.getValue().MappingId);
                    }
                    this.close();
                    o.fireChange();
                    e.fireChange();
                    g.fireChange();
                    h.fireChange();
                },
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            });
            var s = new sap.ui.comp.smarttable.SmartTable("MappingRevisionVHSmartTable",{
                smartFilterId: "MappingRevisionVHSmartFilterBar",
                entitySet: "VH_REVISION",
                initiallyVisibleFields: "Ritclg,Rbunit,MappingId,Revision",
                useExportToExcel: false,
                useVariantManagement: false,
                useTablePersonalisation: false,
                beforeRebindTable: function(e) {
                    e.getParameter("bindingParams").events.dataReceived = function() {
                        v.update();
                    }
                    ;
                }
            });
            s.attachInitialise(function() {
                t._hideFilterEntryInColumnHeaderMenuFor(s);
            });
            v.setTable(s);
            return v;
        },
        getCurrentAppState: function() {
            var s = this.byId("smartFilterBar");
            var e = this.byId("pgdc0010.smartTable");
            var o = new SelectionVariant(JSON.stringify(s.getUiState().getSelectionVariant()));
            return {
                selectionVariant: o.toJSONString(),
                customData: {
                    tableSelectionVariant: JSON.stringify(e.getUiState().getSelectionVariant()),
                    tablePresentationVariant: JSON.stringify(e.getUiState().getPresentationVariant())
                }
            };
        },
        storeCurrentAppState: function() {
            var n = new NavigationHandler(this);
            var A = n.storeInnerAppState(this.getCurrentAppState());
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
                p.done(function(A, s, e) {
                    if (e !== sap.ui.generic.app.navigation.service.NavType.initial) {
                        var h = A && A.bNavSelVarHasDefaultsOnly;
                        var o = new SelectionVariant(A.selectionVariant);
                        var g = o.getParameterNames().concat(o.getSelectOptionsPropertyNames());
                        var u = {
                            replace: true,
                            strictMode: false
                        };
                        var j = new U({
                            selectionVariant: JSON.parse(A.selectionVariant)
                        });
                        var k = this.byId("smartFilterBar");
                        var l = this.byId("pgdc0010.smartTable");
                        this._waitUntilSmartFilterBarIsInitialized(k).then(function() {
                            for (var i = 0; i < g.length; i++) {
                                k.addFieldToAdvancedArea(g[i]);
                            }
                            if (!h || k.getCurrentVariantId() === "") {
                                k.clearVariantSelection();
                                k.clear();
                                k.setUiState(j, u);
                            }
                            if (A.customData && A.customData.tablePresentationVariant) {
                                var t = new U({
                                    selectionVariant: JSON.parse(A.customData.tableSelectionVariant),
                                    presentationVariant: JSON.parse(A.customData.tablePresentationVariant)
                                });
                                l.setUiState(t);
                            }
                            if (!h) {
                                k.search();
                            }
                        });
                    }
                }
                .bind(this));
            }
            .bind(this));
        },
        _waitUntilSmartFilterBarIsInitialized: function(s) {
            return new Promise(function(r, e) {
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