import { Alert as NativeAlert, type AlertButton } from 'react-native';
import i18n from '../i18n';

export const LocalizedAlert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: Parameters<typeof NativeAlert.alert>[3]) {
    NativeAlert.alert(
      i18n.t(title, { defaultValue: title }),
      message ? i18n.t(message, { defaultValue: message }) : undefined,
      buttons?.map((button) => ({
        ...button,
        text: button.text ? i18n.t(button.text, { defaultValue: button.text }) : undefined,
      })),
      options,
    );
  },
};
