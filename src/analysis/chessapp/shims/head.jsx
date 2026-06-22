import { Children, useEffect } from 'react';

function Head({ children }) {
  useEffect(() => {
    const titleElement = Children.toArray(children).find(
      (child) => child && child.type === 'title'
    );

    if (titleElement && typeof titleElement.props?.children === 'string') {
      document.title = titleElement.props.children;
    }
  }, [children]);

  return null;
}

export default Head;
