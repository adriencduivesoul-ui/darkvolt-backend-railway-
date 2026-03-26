import { FC, CSSProperties } from 'react';

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  bgColor?: string;
  style?: CSSProperties;
}

interface GlitchCSSProperties extends CSSProperties {
  '--after-duration': string;
  '--before-duration': string;
  '--after-shadow': string;
  '--before-shadow': string;
  '--glitch-bg': string;
}

const GlitchText: FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = '',
  bgColor = '#050505',
  style: extraStyle,
}) => {
  const style: GlitchCSSProperties = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-2px 0 rgba(255, 30, 30, 0.55)' : 'none',
    '--before-shadow': enableShadows ? '2px 0 rgba(0, 210, 255, 0.45)' : 'none',
    '--glitch-bg': bgColor,
    ...extraStyle,
  };

  return (
    <div
      className={`glitch-text${enableOnHover ? ' glitch-text--hover' : ''}${className ? ' ' + className : ''}`}
      style={style}
      data-text={children}
    >
      {children}
    </div>
  );
};

export default GlitchText;
