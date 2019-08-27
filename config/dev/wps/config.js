const ProjectsRegistry = require('core/project/projectsregistry');
  module.exports = (function() {
  ProjectsRegistry.oncebefore('setCurrentProject', function(project) {
    //WPS FAKE
    project.state.tools = {
      wps: [
        {
          name: 'WPS1',
          url: 'http://sosmet.nerc-bas.ac.uk:8080/wpsmet/WebProcessingService'
        }
      ]
    };


    //
  });
})();
