import { ClsModuleOptions } from 'nestjs-cls';

export const clsConfig = (): ClsModuleOptions => ({
  global: true,
  middleware: { mount: true },
});
