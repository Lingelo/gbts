declare module "ts2c-target-gdbk-n/gb/gb.h" {

    const DISPLAY_ON: void;
    const DISPLAY_OFF: void;
    const SHOW_BKG: void;
    const HIDE_BKG: void;
    const SHOW_WIN: void;
    const HIDE_WIN: void;
    const SHOW_SPRITES: void;
    const HIDE_SPRITES: void;
    const SPRITES_8x16: void;
    const SPRITES_8x8: void;

    const J_START: number;
    const J_SELECT: number;
    const J_B: number;
    const J_A: number;
    const J_DOWN: number;
    const J_UP: number;
    const J_LEFT: number;
    const J_RIGHT: number;

    function remove_VBL(/** @ctype int_handler */ h): void;
    function remove_LCD(/** @ctype int_handler */ h): void;
    function remove_TIM(/** @ctype int_handler */ h): void;
    function remove_SIO(/** @ctype int_handler */ h): void;
    function remove_JOY(/** @ctype int_handler */ h): void;

    function add_VBL(/** @ctype int_handler */ h): void;
    function add_LCD(/** @ctype int_handler */ h): void;
    function add_TIM(/** @ctype int_handler */ h): void;
    function add_SIO(/** @ctype int_handler */ h): void;
    function add_JOY(/** @ctype int_handler */ h): void;

    function mode(/** @ctype UINT8 */ m): void;
    /** @ctype UINT8 */
    function get_mode();
    
    function send_byte(): void;
    function receive_byte(): void;

    function delay(/** @ctype UINT16 */ d): void;

    /** @ctype UINT8 */
    function joypad();

    /** @ctype UINT8 */
    function waitpad(/** @ctype UINT8 */ mask)
    function waitpadup(): void;
    
    function enable_interrupts(): void;
    function disable_interrupts(): void;
    function set_interrupts(/** @ctype UINT8 */ flags): void;

    function reset(): void
    function wait_vbl_done(): void
    function display_off(): void
    function hiramcpy(/** @ctype UINT8 */ dst, /** @ctype const void * */ src, /** @ctype UINT8 */ n): void

    function set_bkg_data(/** @ctype UINT8 */ first_tile, /** @ctype UINT8 */ nb_tiles, /** @ctype unsigned char * */ data): void
    function set_bkg_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ tiles): void
    function get_bkg_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ tiles): void
    function move_bkg(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y): void
    function scroll_bkg(/** @ctype INT8 */ x, /** @ctype INT8 */ y): void

    function set_win_data(/** @ctype UINT8 */ first_tile, /** @ctype UINT8 */ nb_tiles, /** @ctype unsigned char * */ data): void
    function set_win_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ tiles): void
    function get_win_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ tiles): void
    function move_win(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y): void
    function scroll_win(/** @ctype INT8 */ x, /** @ctype INT8 */ y): void

    function set_sprite_data(/** @ctype UINT8 */ first_tile, /** @ctype UINT8 */ nb_tiles, /** @ctype unsigned char * */ data): void
    function get_sprite_data(/** @ctype UINT8 */ first_tile, /** @ctype UINT8 */ nb_tiles, /** @ctype unsigned char * */ data): void
    function set_sprite_tile(/** @ctype UINT8 */ nb, /** @ctype UINT8 */ tile): void
    /** @ctype UINT8 */
    function get_sprite_tile(/** @ctype UINT8 */ nb)
    function set_sprite_prop(/** @ctype UINT8 */ nb, /** @ctype UINT8 */ prop): void
    /** @ctype UINT8 */
    function get_sprite_prop(/** @ctype UINT8 */ nb)
    function move_sprite(/** @ctype UINT8 */ nb, /** @ctype UINT8 */ x, /** @ctype UINT8 */ y): void
    function scroll_sprite(/** @ctype INT8 */ nb, /** @ctype INT8 */ x, /** @ctype INT8 */ y): void
    
    function set_data(/** @ctype unsigned char * */ vram_addr, /** @ctype unsigned char * */ data, /** @ctype UINT16 */ len): void
    function get_data(/** @ctype unsigned char * */ data, /** @ctype unsigned char * */ vram_addr, /** @ctype UINT16 */ len): void

    function set_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ vram_addr, /** @ctype unsigned char * */ tiles): void
    function get_tiles(/** @ctype UINT8 */ x, /** @ctype UINT8 */ y, /** @ctype UINT8 */ w, /** @ctype UINT8 */ h, /** @ctype unsigned char * */ tiles, /** @ctype unsigned char * */ vram_addr): void

}
