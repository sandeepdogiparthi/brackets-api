/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global require, exports, process */

/**
 * Main package that manages the documentation process by gathering the initial configuration
 * settings and controlling the documentation workflow through the different agents and steps:
 *
 * - <b>Workspace:</b> Generates the fileset to be documented and creates the output skeleton for the docs.
 * - <b>Parsers:</b> Responsible for parsing the different files being documented and producing annotated objects.
 * - <b>Processors:</b> Additional process steps for adding custom support for tags and conventions.
 * - <b>Generators:</b> Responsible for generating the output files for the different functional blocks of the docs.
 * - <b>Templates:</b> Fragments holding the logic for rendering the annotated objects produced in the process.
 */
(function () {
    
    "use strict";
    
    var workspace = require("./utils/Workspace");

    var HELP_MSG = "Script generates API Documentation for Brackets project.\n" +
        "usage: node main <source-tree-root> <out-folder> [--exclude=<path>[,<path>]]\n" +
        "example: node main brackets/src doc --exclude=/thirdparty,/styles";
    
    /**
     * Initializes the docs generation process
     * @param {object} config A configuration object
     */
    function init(config) {
        var source      = config.source,
            output      = config.output,
            includes    = config.includes || [],
            excludes    = config.excludes || [],
            assets      = config.assets,
            templates   = config.templates;
        
        if (!source || !output) {
            console.error("Not enough arguments\n" + HELP_MSG);
            process.exit(1);
        }
        
        workspace.load(source, includes, excludes).then(function (fileset) {
            workspace.createOutputSkeleton(output, fileset, assets).then(function (fileset) {
                
                var indexGenerator      = require("./language/js/IndexGenerator"),
                    ModuleParser        = require("./language/js/ModuleParser"),
                    moduleGenerator     = require("./language/js/ModuleGenerator"),
                    searchGenerator     = require("./language/js/SearchGenerator"),
                    closureProcessor    = require("./language/js/GoogleClosureProcessor"),
                    requireProcessor    = require("./language/js/RequireProcessor");
                
                var parser = new ModuleParser([closureProcessor, requireProcessor]);
                
                fileset.files.forEach(function (file) {
                    parser.parse(file.fullPath).then(function (module) {
                        
                        module.name = file.name;
                        module.path = file.docPath;
                        moduleGenerator.generate(templates, module, fileset, output);
                        
                    });
                
                });
                
                indexGenerator.generate(templates, fileset, output);
                searchGenerator.generate(fileset.files, output);
            });
        });
    }
    
    // Exports
    exports.init = init;
    
}());