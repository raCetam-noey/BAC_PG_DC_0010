sap.ui.define('pgdc0010/controller/ErrorHandler',
 [  "sap/ui/base/Object", 
    "sap/m/MessageBox"
    ], 
    function(U, M) {
    
        "use strict";
    
    return U.extend("pgdc0010.controller.ErrorHandler", {
        constructor: function(c) {
            this._oResourceBundle = c.getModel("i18n").getResourceBundle();
            this._oComponent = c;
            this._oModel = c.getModel();
            this._bMessageOpen = false;
            this._sErrorText = this._oResourceBundle.getText("errorText");
            this._oModel.attachMetadataFailed(function(e) {
                var p = e.getParameters();
                this._showServiceError(p.response);
            }, this);
            this._oModel.attachRequestFailed(function(e) {
                function a(s) {
                    return s.charAt(0).toUpperCase() + s.slice(1);
                }
                this._sErrorText = this._oResourceBundle.getText("errorText");
                var p = e.getParameters();
                if (p.response.statusCode === "400") {
                    var E, b, d;
                    try {
                        var r = jQuery.parseJSON(p.response.responseText);
                        E = r.error.message.value;
                        b = r.error.innererror.errordetails;
                    } catch (o) {
                        d = true;
                    }
                    if (!d) {
                        if (b != []) {
                            this._sErrorText = "";
                            for (var i in b) {
                                this._sErrorText += a(b[i].message.trim());
                                this._sErrorText += "\r\n";
                            }
                        } else {
                            this._sErrorText = E;
                        }
                    } else {
                        this._sErrorText = this._oResourceBundle.getText("errorText");
                    }
                    this._showServiceError();
                } else if (p.response.statusCode !== "404" || (p.response.statusCode === 404 && p.response.responseText.indexOf("Cannot POST") === 0)) {
                    this._showServiceError(p.response);
                }
            }, this);
        },
        _showServiceError: function(d) {
            if (this._bMessageOpen) {
                return;
            }
            this._bMessageOpen = true;
            M.error(this._sErrorText, {
                id: "serviceErrorMessageBox",
                details: d,
                styleClass: this._oComponent.getContentDensityClass(),
                actions: [M.Action.CLOSE],
                onClose: function() {
                    this._bMessageOpen = false;
                }
                .bind(this)
            });
        }
    });
});