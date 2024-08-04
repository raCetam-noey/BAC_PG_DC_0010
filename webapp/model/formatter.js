sap.ui.define([], function() {
    "use strict";
    return {
        numberUnit: function(value) {
            if (!value) {
                return "";
            }
            return parseFloat(value).toFixed(2);
        },
        formatterRowStatus: function(status) {
            if (status === "X") {
                return "Error";
            }
            return "None";
        },
        formatterIconVisible: function(value) {
            if (typeof value === "boolean") {
                return !value;
            }
            return true;
        },
        formatterStatusText: function(icon, hasDraft) {
            this.oBundle = this.getResourceBundle && this.getResourceBundle();
            if (this.oBundle === undefined) {
                return "";
            }
            if (typeof icon === "boolean" && icon) {
                return this.oBundle.getText("STS_ACTIVE");
            }
            if (typeof icon === "boolean" && !icon) {
                if (typeof hasDraft === "boolean" && hasDraft) {
                    return this.oBundle.getText("STS_ACTIVEDRAFT");
                } else {
                    return this.oBundle.getText("STS_DRAFT");
                }
            }
            return this.oBundle.getText("STS_ACTIVE");
        },
        formatterStatusState: function(icon, hasDraft) {
            if (typeof icon === "string" && icon === '1') {
                return "Success";
            }
            if ((typeof icon === "string" && icon !== '1') && (typeof hasDraft === "boolean" && hasDraft)) {
                return "Warning";
            }
            return "None";
        },
        formatterStatusIcon: function(icon, hasDraft) {
            if (typeof icon === "string" && icon === '1') {
                return "sap-icon://sys-enter";
            }
            if ((typeof icon === "string" && icon !== '1') && (typeof hasDraft === "boolean" && hasDraft)) {
                return "sap-icon://user-edit";
            }
            return "sap-icon://pending";
        }
    };
});