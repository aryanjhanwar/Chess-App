import React from 'react';

const Image = React.forwardRef(function Image(
  { src, alt = '', width, height, style, ...rest },
  ref
) {
  const mergedStyle = {
    maxWidth: '100%',
    height: 'auto',
    ...(style || {}),
  };

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={mergedStyle}
      {...rest}
    />
  );
});

export default Image;
