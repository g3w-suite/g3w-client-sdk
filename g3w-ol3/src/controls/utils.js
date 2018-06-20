const TOPOFFSET = 35;
module.exports = {
  layout: function({map, position, element}) {
    const positionCode = (position['top'] ? 't' : 'b') + (position['left'] ? 'l' : 'r');
    const viewPort = map.getViewport();
    //check if there are element with the same class .ol-control-t o .ol-control-tl(default di ol3)
    const previusControls = $(viewPort).find('.ol-control-'+positionCode+':visible');
    if (previusControls.length) {
      const previusControl = previusControls.last();
      const previousFirstOffset = position.left ? previusControl.position().left : previusControl.position().top;
      const hWhere = position.left ? 'left' : 'top';
      const previousSecondOffset = hWhere == 'left' ?  previusControl[0].offsetWidth : previusControl[0].offsetHeight;
      let hOffset;
      if (hWhere == 'left') {
        hOffset = element.position()[hWhere] + previousFirstOffset + previousSecondOffset;

      } else {
        hOffset = previousFirstOffset - (previousSecondOffset > TOPOFFSET ? previousSecondOffset: TOPOFFSET);
      }
      element.css(hWhere,hOffset+'px');
    } else {
      if (positionCode == 'br') {
        element.css('bottom', '10px')
      }
    }
  },
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
