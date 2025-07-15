;(function($) {

    "use strict";

    var blogPostsOwl = function() {
        if ( $().owlCarousel ) {
            $('.tf-posts-wrap.has-carousel').each(function(){
                var
                $this = $(this),
                item = $this.data("column"),
                item2 = $this.data("column2"),
                item3 = $this.data("column3"),
                spacer = Number($this.data("spacer")),
                prev_icon = $this.data("prev_icon"),
                next_icon = $this.data("next_icon");

                var loop = false;
                if ($this.data("loop") == 'yes') {
                    loop = true;
                }

                var arrow = false;
                if ($this.data("arrow") == 'yes') {
                    arrow = true;
                } 

                var auto = false;
                if ($this.data("auto") == 'yes') {
                    auto = true;
                }                

                $this.find('.owl-carousel').owlCarousel({
                    loop: loop,
                    margin: spacer,
                    nav: true,
                    pagination: false,
                    autoplay: auto,
                    autoplayTimeout: 5000,
                    autoplayHoverPause: true,
                    animateIn: 'fadeIn',
                    animateOut: 'fadeOut',
                    navText: [$('.tf-prev'),$('.tf-next'),],
                    responsive: {
                        0:{
                            items:item3
                        },
                        768:{
                            items:item2
                        },
                        1000:{
                            items:item
                        }
                    }
                });

            });
        }
    } 

    var blogPostsGallery = function() {
        $(".featured-image-gallery").each(function() {
            var $this = $(this);
            var animation = $this.data('animation_images'),
                autoplay = $this.data('autoplay'),
                slideshowSpeed = $this.data('slideshowSpeed'),
                controlNav = $this.data('controlnav'),
                directionNav = $this.data('directionnav'),
                prevText = $this.data('prevtext'),
                nextText = $this.data('nexttext');
            $this.flexslider({
                animation: animation,
                slideshow: autoplay,
                slideshowSpeed: slideshowSpeed,
                animationSpeed: 1000,
                animationLoop: true,
                controlNav: controlNav,
                directionNav: directionNav,
                prevText: '<i class="' + prevText + '" aria-hidden="true"></i>',
                nextText: '<i class="' + nextText + '" aria-hidden="true"></i>',
                useCCS: false
            });
        });
    }    

    var blogLoadMore = function() {

        /*var $container_wrap = $('.tf-posts-wrap'); 
        var $container = $('.tf-posts-wrap').find('.tf-posts');  

        $('.navigation.loadmore a').on('click', function(e) {
            e.preventDefault(); 

            $container.after('<div class="tfpost-loading"><span></span></div>');

            $.ajax({
                type: "GET",
                url: $(this).attr('href'),
                dataType: "html",
                success: function( out ) {
                    var result = $(out).find('.column');  
                    var nextlink = $(out).find('.navigation.loadmore a').attr('href');

                    result.css({ opacity: 0 , visibility: 'hidden' });
                    if ($container.hasClass('masonry')) {
                        $container.append(result).imagesLoaded(function () {
                            result.css({ opacity: 1 , visibility: 'visible' });
                            $container.isotope('appended', result);
                        });
                    }
                    else {
                        $container.append(result).imagesLoaded(function () {
                            result.css({ opacity: 1 , visibility: 'visible' });
                            $container.isotope('appended', result);
                        });                         
                    }

                    if ( nextlink != undefined ) {
                        $('.navigation.loadmore a').attr('href', nextlink);
                        $container_wrap.find('.tfpost-loading').remove();
                    } else {
                        $container_wrap.find('.tfpost-loading').addClass('no-ajax').text('All posts loaded').delay(2000).queue(function() {$(this).remove();});
                        $('.navigation.loadmore a').remove();
                    }
                }
            });
        });*/

        $('.tf-posts-wrap .navigation.loadmore a').on('click', function(e) {
            e.preventDefault();
            var class_id =  $(this).closest('.tf-posts-wrap').data('class_id');
            var class_id_string = '.'+class_id;
            var $container_wrap = $(class_id_string);
            var $container = $container_wrap.find('.tf-posts');
            var scroll_loadmore = $container_wrap.find('.scroll-loadmore');
            
            $(this).closest('.navigation.loadmore').addClass('loader');

            $.ajax({
                type: "GET",
                url: $(this).attr('href'),
                dataType: "html",
                success: function( out ) {
                    var result = $(out).find('.column');  
                    var nextlink = $(out).find('.navigation.loadmore a').attr('href');
                    
                    $container.each(function() {
                        $(this).append(result).imagesLoaded(function () {
                            setTimeout(function() {                            
                                $container.isotope('appended', result);
                            }, 1000);                                                
                        });   
                    });                                       

                    $('.navigation.loadmore').removeClass('loader');

                    if ( nextlink != undefined ) {
                        $('.navigation.loadmore a').attr('href', nextlink);
                    } else {                        
                        $('.navigation.loadmore').remove();
                    }

                    $('html, body').animate({
                        scrollTop: scroll_loadmore.offset().top - 300
                    }, 700);
                }
            });
        });           
    }

    

    var blogMasonry = function() {
        $('.tf-posts-wrap .tf-posts').each(function(){
            var $this = $(this);
            if ($this.hasClass('masonry')) {
                var $grid = $this.isotope({
                    itemSelector: '.column',
                    percentPosition: true,
                    masonry: {
                    columnWidth: '.grid-sizer'
                    }
                });
                
                $grid.imagesLoaded().progress( function() {
                    $grid.isotope('layout');
                });
            } 
        });            
    }

    var postFormatIziModal = function(){
        if ($('body').find('div').hasClass('izimodal')) {
            $(".izimodal").iziModal({
                width: 850,
                top: null,
                bottom: null,
                borderBottom: false,
                padding: 0,
                radius: 3,
                zindex: 999999,
                iframe: false,
                iframeHeight: 400,
                iframeURL: null,
                focusInput: false,
                group: '',
                loop: false,
                arrowKeys: true,
                navigateCaption: true,
                navigateArrows: true, // Boolean, 'closeToModal', 'closeScreenEdge'
                history: false,
                restoreDefaultContent: true,
                autoOpen: 0, // Boolean, Number
                bodyOverflow: false,
                fullscreen: false,
                openFullscreen: false,
                closeOnEscape: true,
                closeButton: true,
                appendTo: 'body', // or false
                appendToOverlay: 'body', // or false
                overlay: true,
                overlayClose: true,
                overlayColor: 'rgba(0, 0, 0, .7)',
                timeout: false,
                timeoutProgressbar: false,
                pauseOnHover: false,
                timeoutProgressbarColor: 'rgba(255,255,255,0)',
                transitionIn: 'comingIn',
                transitionOut: 'comingOut',
                transitionInOverlay: 'fadeIn',
                transitionOutOverlay: 'fadeOut',
                onFullscreen: function(){},
                onResize: function(){},
                onOpening: function(){},
                onOpened: function(){},
                onClosing: function(){},
                onClosed: function(){},
                afterRender: function(){}
            });

            $(document).on('click', '.trigger', function (event) {
                event.preventDefault();
                $('.izimodal').iziModal('setZindex', 99999999);
                $('.izimodal').iziModal('open', { zindex: 99999999 });
                $('.izimodal').iziModal('open');
            });
        }
    }   


$(window).on('elementor/frontend/init', function() {
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tfposts.default', blogPostsOwl );
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tfposts.default', blogPostsGallery );        
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tfposts.default', blogLoadMore );
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tfposts.default', blogMasonry );
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tfposts.default', postFormatIziModal );
});

})(jQuery);