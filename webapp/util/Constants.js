sap.ui.define([], function() {
    "use strict";
    var constants = Object.freeze({
        MappingTypeEntitySetName: "GRVCOA02Type",
        NavToMappingItem: "/to_Grvcoa04", 
        MappingItemEntitySet: "/FsItemMappingEntity",
        MappingHeaderEntitySet: "/GRVCOA02",
        ExportMappingCollectionSetUrl: "/FsItemMappingEntity('')/$value",
        ExportMappingCollectionItemSetUrl: "/FsItemMappingEntity(''{0}'')/$value",
        FnImptCreateDraft: "/CreateDraft",
        FnImptDiscardDraft: "/DiscardDraft",
        FnImptActiveDraft: "/ActiveDraft",
        FnImptCopyMapping: "/CopyMapping",
        CreateMappingDialogFragmentPath: "pgdc0010.view.fragment.CreateMapping",
        CreateRevisionDialogFragmentPath: "pgdc0010.view.fragment.CreateRevision",
        CopyMappingDialogFragmentPath: "pgdc0010.view.fragment.CopyMapping",
        AddMappingDialogFragmentPath: "pgdc0010.view.fragment.AddMapping",
        AssignFSItemDialogFragmentPath: "pgdc0010.view.fragment.AssignFSItem",
        AssignGLAccountDialogFragmentPath: "pgdc0010.view.fragment.AssignGLAccount",
        BusyDialogFragmentPath: "pgdc0010.view.fragment.BusyDialog",
        FullPageId: "pgdc0010.Worklist.fullpage",
        SmartTableId: "pgdc0010.worklist.smarttable",
        AnalyticalTableId: "pgdc0010.worklist.analyticaltable",
        SmartFilterBarId: "pgdc0010.Worklist.smartFilterBar",
        MapDetailPageId: "pgdc0010.ObjectPageLayout",
        MappingSmartTableId: "pgdc0010.smartTable.mapping",
        MappingTableId: "pgdc0010.table.mapping-ui5table",
        GLAccountSmartTableId: "pgdc0010.smartTable.GLAccountTable",
        GLAccountTableId: "pgdc0010.table.unmapped.gla",
        FSItemSmartTableId: "pgdc0010.smartTable.FSItemTable",
        FSItemTableId: "pgdc0010.table.unmapped.fsi",
        SectionMapId: "pgdc0010.section0",
        SubSectionMapId: "pgdc0010.sub.section0",
        SubSectionMapMultiComboBoxId: "pgdc0010.add.mapping.multicombobox.gla",
        SubSectionGlaMultiComboBoxId: "pgdc0010.assign.gla.multicombobox.gla",
        SectionMapVBoxId: "pgdc0010.mapping.vbox.ms",
        FragmentOperateMap: {
            "CreateMapping": "CM",
            "Duplicate": "DU",
            "CreateRevision": "CR"
        },
        UploadedFSItemMappingView: "pgdc0010.view.ExcelUploadMap",
        UploadedViewID: "UploadedTable",
        UploadedFSItemMappingSmartTable: "pgdc0010.fsi.smartTable",
        UploadedFSItemMappingTable: "pgdc0010.fsi.table",
        Uploader: "pgdc0010.uploader",
        MainPage: "pgdc0010.MainPage",
        BusyDialog: "pgdc0010.view.fragment.BusyDialog",
        DownloadDialogFra: "pgdc0010.view.fragment.DownloadDialog",
        DownloadFraID: "DownloadDialog",
        TemplateTypeDropDown: "pgdc0010.download.templateTypeDropdown",
        RadioButtonGroup: "pgdc0010.download.radioButtonGroup",
        DownloadFraConsCOA: "pgdc0010.download.sf.ccoa",
        DownloadFraGLCOA: "pgdc0010.download.sf.glcoa",
        DownloadFraMappingID: "pgdc0010.download.sf.id",
        DownloadFraRevision: "pgdc0010.download.sf.revision",
        DownloadFraUnmappedGL: "pgdc0010.download.sf.withUnmappedGL",
        FSItemMapping: "FSIMAP",
        UploadedFSItemMaping: "/GRVCOA02Type",
        UploadedFSItemMapingSet: "/GRVCOA02",
        NavToMappingItem: "/FSItemMappingItemDraftSet",
        UploadMappingSmartTableId: "pgdc0010.smartTable.uploadmapping",
        UploadMappingTableId: "pgdc0010.table.uploadmapping",
        GLAccoutInput: "pgdc0010.table.column.GlAccount",
        FnImptCreateDraft: "/CreateDraft",
        FnImptEditDraft: "/EditDraft"
    });
    return constants;
});