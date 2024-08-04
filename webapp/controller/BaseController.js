sap.ui.define('pgdc0010/controller/BaseController', ["sap/ui/core/mvc/Controller"], function(C) {
    "use strict";
    return C.extend("pgdc0010.controller.BaseController", {
        getRouter: function() {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },
        getModel: function(n) {
            return this.getView().getModel(n);
        },
        setModel: function(m, n) {
            return this.getView().setModel(m, n);
        },
        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        onShareEmailPress: function() {
            var v = (this.getModel("objectView") || this.getModel("worklistView"));
            sap.m.URLHelper.triggerEmail(null, v.getProperty("/shareSendEmailSubject"), v.getProperty("/shareSendEmailMessage"));
        },
        showErrorMessageBox: function(j) {
            var J = j || {
                result: {
                    title: this.getResourceBundle().getText("JsonResultTitle")
                }
            };
            var c = !!this.getView().$().closest(".sapUiSizeCompact").length;
            sap.m.MessageBox.show(null, {
                icon: sap.m.MessageBox.Icon.ERROR,
                title: this.getResourceBundle().getText("ErrMessageboxTitle"),
                actions: [sap.m.MessageBox.Action.CLOSE],
                details: J,
                styleClass: c ? "sapUiSizeCompact" : "",
                contentWidth: "300px"
            });
        },
      
        _callFunctionImport: function(c, f, u) {
            return new Promise(function(a, r) {
                var m = c.getOwnerComponent().getModel();
                m.callFunction(f, {
                    method: "POST",
                    urlParameters: u,
                    success: function(d, b) {
                        a(d);
                    },
                    error: function(e) {
                        r(e);
                    }
                });
            }
            );
        }
    });
});