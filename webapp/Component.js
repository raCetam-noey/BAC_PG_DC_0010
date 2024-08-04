/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "pgdc0010/model/models",
        "pgdc0010/controller/ErrorHandler"
    ],
    function (UIComponent, Device, models, ErrorHandler) {
        "use strict";

        return UIComponent.extend("pgdc0010.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function() {
                UIComponent.prototype.init.apply(this, arguments);
                // this._oErrorHandler = new ErrorHandler(this);
                this.setModel(models.createDeviceModel(), "device");
                this.setModel(models.createFLPModel(), "FLP");
                this.setModel(models.createUIModel(), "ui");
                this.setModel(models.createParamModel(), "Para");
                this.getRouter().initialize();
                this._initNavigation();
            },
            destroy: function() {
                UIComponent.prototype.destroy.apply(this, arguments);
            },
            getContentDensityClass: function() {
                if (this._sContentDensityClass === undefined) {
                    if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!D.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            },
            _getUrlParameter: function(component, param) {
                var Params = this._getUrlParameters(component);
                if (Params) {
                    if (param in Params) {
                        return Params[param][0];
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            },
            _getUrlParameters: function(component) {
                if (component.getOwnerComponent && component.getOwnerComponent().getComponentData()) {
                    return component.getOwnerComponent().getComponentData().startupParameters;
                } else if (component.getComponentData && component.getComponentData() && component.getComponentData().startupParameters) {
                    var param = component.getComponentData().startupParameters;
                    var Params = "responderOn";
                    if (param) {
                        if ((Params in param)) {
                            return jQuery.sap.getUriParameters().mParams;
                        } else {
                            return param;
                        }
                    } else {
                        return undefined;
                    }
                } else {
                    return jQuery.sap.getUriParameters().mParams;
                }
            },
            _initNavigation: function() {
                var object = (this._getUrlParameter(this, "objectId") !== undefined) ? decodeURIComponent(this._getUrlParameter(this, "objectId")) : this._getUrlParameter(this, "objectId");
                var router = this.getRouter();
                var urlParameters = {};
                var section;
                var absoluteUrl;
                var hashChanger = sap.ui.core.routing.HashChanger.getInstance();
                var navFrom = (object !== undefined) ? "ConsolidationFinanceSItem-mappingImport" : "ConsolidationFinanceSItem-unknown";
                var param = {
                    navFrom: navFrom
                };
                try {
                    this.setModel(new sap.ui.model.json.JSONModel(param), "navFrom");
                } catch (e) {}
                if (object) {
                    urlParameters.objectId = encodeURIComponent(object);
                    section = "Detail";
                    absoluteUrl = router.getURL(section, urlParameters);
                    console.log(absoluteUrl);
                } else {
                    var component = hashChanger.getHash();
                    console.log(component)
                    if (component && component.startsWith("UploadMain")) {
                        absoluteUrl = component;
                    }
                }
                if (absoluteUrl) {
                    hashChanger.replaceHash(absoluteUrl);
                }
            }
        });
    });