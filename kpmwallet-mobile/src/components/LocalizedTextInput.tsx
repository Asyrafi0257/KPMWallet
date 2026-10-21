import React from 'react';
import { TextInput as NativeTextInput, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

export function LocalizedTextInput(props: TextInputProps) {
  const { t } = useTranslation();
  return (
    <NativeTextInput
      {...props}
      placeholder={props.placeholder ? t(props.placeholder, { defaultValue: props.placeholder }) : undefined}
    />
  );
}
