import Phaser from 'phaser';

export class IslandScene extends Phaser.Scene {
  constructor() {
    super('IslandScene');
  }

  preload(): void {
    this.load.tilemapTiledJSON('island', 'assets/images/island/isla.tmj');
    this.load.image('aguasyhierbas', 'assets/images/island/Pocket Valley - Essentials/48x48/tilesets/Other Engines/Outside_A1.png');
    this.load.image('tierras', 'assets/images/island/Pocket Valley - Essentials/48x48/tilesets/Other Engines/Outside_A2.png');
    this.load.image('naturaleza', 'assets/images/island/Pocket Valley - Essentials/48x48/tilesets/rpgmaker mv_mz/nature_b_c_d_e.png');
  }

  create(): void {
    const map = this.make.tilemap({ key: 'island' });
    const aguasyhierbas = map.addTilesetImage('aguasyhierbas', 'aguasyhierbas');
    const tierras = map.addTilesetImage('tierras', 'tierras');
    const naturaleza = map.addTilesetImage('naturaleza', 'naturaleza');

    const layers = map.layers.map(l => map.createLayer(l.name, [aguasyhierbas, tierras, naturaleza], 0, 0));

    layers.forEach(layer => layer.setCollisionByProperty({ solid: true }));

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
  }
}
