var t = require('i18n/i18n.service').t;
var GUI = require('gui/gui');
var ProjectsStore = require('core/project/projectsstore');

Vue.component('g3w-projects-catalog',{
    template: require('./projects.html'),
    data: function() {
      return {
        state: ProjectsStore.state
      }
    },
    computed: {
      currentProjectGid: function(){
        return this.state.currentProject.gid;
      }
    },
    methods: {
      switchProject: function(gid){
        ProjectsStore.switchProject(gid);
      }
    }
});
