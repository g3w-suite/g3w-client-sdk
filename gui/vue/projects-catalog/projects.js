const ProjectsRegistry = require('core/project/projectsregistry');

Vue.component('g3w-projects-catalog',{
    template: require('./projects.html'),
    data: function() {
      return {
        state: ProjectsRegistry.state
      }
    },
    computed: {
      currentProjectGid: function(){
        return this.state.currentProject.gid;
      }
    },
    methods: {
      switchProject: function(gid){
        ProjectsRegistry.switchProject(gid);
      }
    }
});
