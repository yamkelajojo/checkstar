// Web shim for react-native-pager-view: horizontal snap-scrolling container
// with a setPage() ref API and onPageSelected/onPageScroll events, matching
// the subset of behaviour the app uses. Native builds are unaffected.
const React = require('react');

const PagerView = React.forwardRef(function PagerView(
  { children, onPageSelected, onPageScroll, initialPage = 0, style },
  ref
) {
  const scrollerRef = React.useRef(null);
  const widthRef = React.useRef(0);
  const lastPage = React.useRef(initialPage);
  const settleTimer = React.useRef(null);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (el && initialPage > 0) {
      el.scrollLeft = initialPage * el.clientWidth;
    }
  }, [initialPage]);

  React.useImperativeHandle(ref, () => ({
    setPage: (page) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
      fireSelected(page);
    },
    setPageWithoutAnimation: (page) => {
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollLeft = page * el.clientWidth;
      fireSelected(page);
    },
  }));

  const fireSelected = (position) => {
    if (position === lastPage.current) return;
    lastPage.current = position;
    onPageSelected && onPageSelected({ nativeEvent: { position, offset: 0 } });
  };

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const w = el.clientWidth;
    if (w <= 0) return;
    widthRef.current = w;
    const frac = el.scrollLeft / w;
    const position = Math.round(frac);
    onPageScroll &&
      onPageScroll({
        nativeEvent: { position: Math.floor(frac), offset: frac - Math.floor(frac) },
      });
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => fireSelected(position), 120);
  };

  const kids = React.Children.map(children, (child) =>
    React.createElement(
      'div',
      { style: { width: '100%', flexShrink: 0, scrollSnapAlign: 'start' } },
      child
    )
  );

  return React.createElement(
    'div',
    {
      ref: scrollerRef,
      onScroll: handleScroll,
      style: {
        ...(style || {}),
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'scroll',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
      },
    },
    kids
  );
});

module.exports = PagerView;
module.exports.default = PagerView;
