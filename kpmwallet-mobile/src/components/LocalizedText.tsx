import React from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

function translateChildren(children: React.ReactNode, t: (key: string, options?: any) => string): React.ReactNode {
  if (typeof children === 'string') {
    const leadingSpace = children.match(/^\s*/)?.[0] ?? '';
    const trailingSpace = children.match(/\s*$/)?.[0] ?? '';
    const content = children.trim();
    return content
      ? `${leadingSpace}${t(content, { defaultValue: content })}${trailingSpace}`
      : children;
  }
  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <React.Fragment key={index}>{translateChildren(child, t)}</React.Fragment>
    ));
  }
  return children;
}

export function LocalizedText(props: TextProps) {
  const { t } = useTranslation();
  return (
    <NativeText {...props}>{translateChildren(props.children, t)}</NativeText>
  );
}
