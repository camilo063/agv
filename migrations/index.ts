import * as migration_20260707_174020_inicial from './20260707_174020_inicial';

export const migrations = [
  {
    up: migration_20260707_174020_inicial.up,
    down: migration_20260707_174020_inicial.down,
    name: '20260707_174020_inicial'
  },
];
