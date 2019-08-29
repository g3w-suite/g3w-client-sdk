module.exports = {
  setCurrentProject(project){
    project.state.tools = {
      wps: [
        {
          name: 'WPS1',
          url: 'http://sosmet.nerc-bas.ac.uk:8080/wpsmet/WebProcessingService'
        }]
    }
  }
};
