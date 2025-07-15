;(function($) {

    "use strict";

    var tf_responsive_menu = function() {
        
        $('.tf-nav-menu').each(function(){
            var $this = $(this).data('id_random'),
            $tf_nav_menu = $('.'+$this),
            $btn_menu_mobile = $('.'+$this).find('.btn-menu-mobile'),
            $close_menu_panel_style_default = $('.'+$this).find('.close-menu-panel-style-default'),
            $btn_menu_only = $('.'+$this).find('.btn-menu-only'),
            $mobile_menu_overlay = $('.'+$this).find('.mobile-menu-overlay'),
            $mobile_menu_close = $('.'+$this).find('.tf-close');

            $('.'+$this).find('.btn-submenu').remove();
            var hasChildMenu = $tf_nav_menu.find('.mainnav-mobi').find('li:has(ul)');
            hasChildMenu.children('ul').hide();                                    
            hasChildMenu.children('a').after('<span class="btn-submenu"><i class="fa fa-angle-down" aria-hidden="true"></i></span>');

            var menuType = 'desktop';
            $(window).on('load resize', function() {
                var currMenuType = 'desktop';

                if ( matchMedia( 'only screen and (max-width: 991px)' ).matches ) {                
                    currMenuType = 'mobile';
                }

                if ( currMenuType !== menuType ) {
                    menuType = currMenuType;
                } else {                             
                    $('.'+$this).find('.mobile-menu-overlay').removeClass('active');
                    $('.'+$this).find('.nav-panel').removeClass('active');      
                }

            });

            $(document).on('click', '.mainnav-mobi li .btn-submenu', function(e) {
                $(this).toggleClass('active').next('ul').slideToggle(300);
                e.stopImmediatePropagation();
                e.preventDefault();
            }); 

            //Open Nav
            $($btn_menu_mobile).on('click', function() {                
                $(this).addClass('active');
                $(this).siblings().addClass('active');
            });             

            //Close Nav
            $($close_menu_panel_style_default).on('click', function() {             
                $(this).closest('.nav-panel').removeClass('active');             
                $(this).closest('.nav-panel').siblings().removeClass('active');           
            });

            $($mobile_menu_overlay).on('click', function() {             
                $(this).siblings().removeClass('active');            
                $(this).removeClass('active');            
            });

            $($mobile_menu_close).on('click', function() {             
                $(this).siblings().removeClass('active');            
                $(this).removeClass('active');            
            }); 

            $($btn_menu_only).on('click', function() { 
                $(this).siblings().addClass('active');
            });


            
        });        
                         
    }

    var tf_onepage_nav = function () {
        $('.tf-nav-menu.has-one-page .mainnav > ul > li > a').on('click',function(e) {

            var anchor = $(this).attr('href').split('#')[1];            
            var largeScreen = matchMedia('only screen and (min-width: 992px)').matches;
            var headerHeight = 0;
            headerHeight = $('.header').height();        
            if ( anchor ) {
                if ( $('#'+anchor).length > 0 ) {
                   if ( $('.header-shadow').length > 0 ) {
                        headerHeight = headerHeight;
                   } else {
                        headerHeight = 0;
                   }                   
                   var target = $('#'+anchor).offset().top - headerHeight;
                   $('html,body').animate({scrollTop: target}, 1000, 'easeInOutExpo');
                }
            }

            e.preventDefault();

        });
    } 

$(window).on('elementor/frontend/init', function() {
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tf-nav-menu.default', tf_responsive_menu );  
    elementorFrontend.hooks.addAction( 'frontend/element_ready/tf-nav-menu.default', tf_onepage_nav );
});

})(jQuery);