(function($) {
    var is_image_loaded, canvas_style, drawline, drawpoint;

    is_image_loaded = function(img) {
        if (!img.complete) {
            return false;
        }
        if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0) {
            return false;
        }
        return true;
    };
    create_canvas_for = function(img) {
        if($.browser.msie) {
        	var canvas = document.createElement('canvas');
        	canvas.setAttribute("width", img.width);
        	canvas.setAttribute("height", img.height);
        	G_vmlCanvasManager.initElement(canvas);
        	canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            return canvas;
        } else {
        	var c = $(
                    '<canvas style="width:' + img.width + 'px;height:' + img.height
                            + 'px;"></canvas>').get(0);
            c.getContext("2d").clearRect(0, 0, c.width, c.height);
            return c;
        }
    };
    canvas_style = {
        position : 'absolute',
        left : 0,
        top : 0,
        padding : 0,
        border : 0
    };
    drawline = function(canvas, x1, y1, x2, y2) {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineWidth = 2;
        context.closePath();
        context.strokeStyle = 'rgb(100,149,237)';
        context.stroke();
    };
    drawpoint = function(canvas, x, y) {
        var context = canvas.getContext('2d');
        context.beginPath();
        context.arc(x, y, 4, 0, 2 * Math.PI, true);
        context.closePath();
        context.fillStyle = 'rgb(100,149,237)';
        context.fill();
    };

    var methods = {
        init : function(options) {
            options = $.extend({}, $.fn.imagecanvasmap.defaults, options);
            return this.each(function() {
                var $this = $(this), data = $this.data('imagecanvasmap');
                if (!data) {
                    var clickX = new Array();
                    var clickY = new Array();

                    if (!is_image_loaded(this)) {
                        return window.setTimeout(function() {
                            $this.imagecanvasmap(options);
                        }, 200);
                    };
                    
                    var wrapper = $('<div></div>').css({
                        display:'block',
                        background:'url("'+this.src+'")',
                        position:'relative',
                        padding:0,
                        width:this.width,
                        height:this.height
                    });
                    wrapper.addClass($this.attr('class'));
                    $this.before(wrapper).css('opacity', 0).css(canvas_style).remove();
                    if($.browser.msie) {$this.css('filter', 'Alpha(opacity=0)');}
                    wrapper.append($this);

                    var canvas = create_canvas_for(this);
                    $(canvas).css(canvas_style);
                    canvas.height = this.height;
                    canvas.width = this.width;
                    $this.before(canvas);

                    wrapper.click(function(e) {
                        if (!options.draw)
                            return;
                        var x = e.pageX - this.offsetLeft;
                        var y = e.pageY - this.offsetTop;
                        if (clickX.length > 2) {
                            if (Math.abs(clickX[0] - x) < 15
                                    && Math.abs(clickY[0] - y) < 15) {
                            	options.draw = false;
                                drawline(canvas, clickX[0], clickY[0],
                                        clickX[clickX.length - 1],
                                        clickY[clickY.length - 1]);
                                var coords = '';
                                for(var i = 0; i < clickX.length; i++) {
                                    coords += clickX[i] + ',' + clickY[i] + ",";
                                }
                                coords = coords.substr(0, coords.length - 1);
                                options.onComplete(coords);
                                return;
                            }
                            for (var i = 1; i < clickX.length; i++) {
                                if (Math.abs(clickX[i] - x) < 15
                                        && Math.abs(clickY[i] - y) < 15) {
                                    return;
                                }
                            }
                        } else {
                            for ( var i = 1; i < clickX.length; i++) {
                                if (Math.abs(clickX[i] - x) < 15
                                        && Math.abs(clickY[i] - y) < 15) {
                                    return;
                                }
                            }
                        }
                        clickX.push(x);
                        clickY.push(y);
                        drawpoint(canvas, x, y);
                        if (clickX.length > 1) {
                            drawline(canvas, clickX[clickX.length - 2],
                                    clickY[clickY.length - 2],
                                    clickX[clickX.length - 1],
                                    clickY[clickY.length - 1]);
                        }
                    });
                    
                    var usemap = $this.get(0).getAttribute('usemap');
                    if(usemap) {
                        var map = $('map[name="'+usemap.substr(1)+'"]');
                        if($this.is('img') && usemap && map.size() > 0) {
                            var areas = map.find('area');
                            areas.each(function() {
                                coords = this.getAttribute('coords').split(',');
                                for(var i = 0; i < coords.length; i++) {
                                    coords[i] = parseFloat(coords[i]);
                                }
                                var shape = this.getAttribute('shape').toLowerCase().substr(0,4);
                                if(shape === 'poly') {
                                    var context = canvas.getContext('2d');
                                    context.beginPath();
                                    context.moveTo(coords[0], coords[1]);
                                    for(i=2; i < coords.length; i+=2) {
                                        context.lineTo(coords[i], coords[i+1]);
                                    }
                                    context.lineWidth = 2;
                                    context.closePath();
                                    context.strokeStyle = 'rgb(100,149,237)';
                                    context.stroke();
                                } else if(shape === 'rect') {
                                    var context = canvas.getContext('2d');
                                    context.beginPath();
                                    context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
                                    context.lineWidth = 2;
                                    context.closePath();
                                    context.strokeStyle = 'rgb(100,149,237)';
                                    context.stroke();
                                }
                            });
                            
                            $(map).find('area').bind('mouseover', options.mouseover).bind('mouseout', options.mouseout);
                        }
                    }
                    
                    $this.data('imagecanvasmap', {
                        options : options,
                        clickX : clickX,
                        clickY : clickY,
                        canvas : canvas
                    });
                }
            });
        },
        draw : function() {
            return this.each(function() {
                var data = $(this).data('imagecanvasmap');
                data.options.draw = true;
            });
        },
        clear : function() {
            return this.each(function() {
                var data = $(this).data('imagecanvasmap');
                data.canvas.getContext('2d').clearRect(0, 0, data.canvas.width,
                        data.canvas.height);
            });
        }
    };

    $.fn.imagecanvasmap = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(
                    arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method
                    + ' does not exist on jQuery.imagecanvasmap');
        }
    };

	$.fn.imagecanvasmap.defaults = {
        onComplete : function(){},
		mouseover : function(){},
		mouseout : function(){},
		draw : false
	};
})(jQuery);
