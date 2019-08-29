const ProjectsRegistry = require('core/project/projectsregistry');
const ApplicationService = require('core/applicationservice');
const GUI = require('gui/gui');

// Handle project configuration to insert custom element on project
ProjectsRegistry.oncebefore('setCurrentProject', function(project) {
  const wps = require('./wps/index');
  wps['setCurrentProject'](project);
});

//Ready GUI
GUI.once('ready', function(){});


