sap.ui.define('pgdc0010/controller/NotFound.controller', ["pgdc0010/controller/BaseController"], function(B) {
    "use strict";
    return B.extend("pgdc0010.controller.NotFound", {
        onLinkPressed: function() {
            this.getRouter().navTo("worklist");
        }
    });
});