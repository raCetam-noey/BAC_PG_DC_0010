sap.ui.define(
    [
    "pgdc0010/controller/ExcelUpload.controller"
    ],
    function(ExcelUpload) {
      "use strict";
  
      return ExcelUpload.extend("pgdc0010.controller.ExcelUploadMap", {
        onInit: function() {
            var s = this.byId("pgdc0010.fsi.smartTable");
            this._waitUntilSmartTableIsInitialized(s).then(function() {
                this._handleInboundNavigation();
            }
            .bind(this));
        },
        onRouteMatched: function(e) {
            if (!this.placeholderContainer) {
                this.placeholderContainer = e.getParameter("targetControl");
            } else {
                this.placeholderContainer.hidePlaceholder();
            }
        },
        _waitUntilSmartTableIsInitialized: function(s) {
            return new Promise(function(r) {
                if (s.isInitialised()) {
                    r(s);
                } else {
                    s.attachInitialise(function() {
                        r(s);
                    });
                }
            }
            );
        },
      });
    }
  );
  