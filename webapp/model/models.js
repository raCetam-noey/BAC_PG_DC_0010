sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
        createDeviceModel: function() {
            var model = new JSONModel(Device);
            model.setDefaultBindingMode("OneWay");
            return model;
        },
        createFLPModel: function() {
            var g = jQuery.sap.getObject("sap.ushell.Container.getUser")
              , i = g ? g().isJamActive() : false
              , model = new JSONModel({
                isShareInJamActive: i
            });
            model.setDefaultBindingMode("OneWay");
            return model;
        },
        createUIModel: function() {
            var model = new JSONModel({
                refreshBtnEnabled: true,
                importBtnEnabled: true,
                exportBtnEnabled: false,
                assignBtnEnabled: false,
                createMappingBtnEnabled: true,
                deleteBtnEnabled: false,
                duplicateBtnEnabled: false,
                createRevisionBtnEnabled: true,
                createMappingContentHeight: "480px",
                createMappingContentVisible: true,
                messageTextColumnVisible: true,
                toggleFilterBtnVisible: true,
                glaTableVisible: false,
                fsiTableVisible: false,
                editMode: false,
                deleteMapBtnEnabled: false,
                assignFsBtnEnabled: false,
                assignGlBtnEnabled: false,
                assignFsiDialogVisible: true,
                assigenFsiSaveBtnEnabled: true,
                MappingId: "",
                mappingDescLo: "",
                mappingDescGr: "",
                revision: "",
                revisionDescLo: "",
                revisionDescGr: "",
                newRevision: "",
                newRevisionDesc: "",
                selectedSection: "pgdc0010.section1",
                fromPeriod: 0,
                toPeriod: 999,
                fromYear: 1971,
                toYear: 2018,
                fragmentTitle: null,
                fragmentOperate: null
            });
            return model;
        },


        createParamModel: function () {
            var model = new JSONModel({
                ConsolidationChartOfAccounts: "",
                Unit: "",
                FSItemMappingId: "",
                FSItemMappingRevision: "",
                objectId: ""
            })

            return model;
        }


    };

});