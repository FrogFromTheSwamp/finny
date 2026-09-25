declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

declare module '*.jpeg' {
  import type { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';
  const content: ComponentType<SVGProps<SVGSVGElement>>;
  export default content;
}