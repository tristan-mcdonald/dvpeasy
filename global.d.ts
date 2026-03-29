import { IStaticMethods } from 'flyonui/flyonui';

declare global {
  interface Window {
    _;
    $: typeof import('jquery');
    jQuery: typeof import('jquery');
    DataTable;
    Dropzone;

    HSStaticMethods: IStaticMethods;
  }
}

export {};
