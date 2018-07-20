const TOPOFFSET = 35;
module.exports = {
  layout: function({map, position, element}) {},
  changeLayoutBottomControl: function({map, position, element}) {
    const viewPort = map.getViewport();
    const positionCode = (position['top'] ? 't' : 'b') + (position['left'] ? 'l' : 'r');
    const previusControls = $(viewPort).find('.ol-control-' + positionCode + ':visible');
    if(previusControls.length) {
      let previusControl;
      previusControls.each((index, elem) => {
        if(elem != element[0])
          previusControl = $(elem)
        else
          return false
      });
      if (previusControl) {
        const previousTopPosition = previusControl.position().top;
        const elementTopPosition = element.position().top;
        if ((previousTopPosition - elementTopPosition) != TOPOFFSET ) {
          const hOffset = previousTopPosition - TOPOFFSET;
          element.css('top', hOffset + 'px');
        }
      }
    }
  }
};
