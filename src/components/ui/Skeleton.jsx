let skeletonStylesInjected = false;
function injectSkeletonStyles() {
  if (skeletonStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `@keyframes skeleton-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`;
  document.head.appendChild(style);
  skeletonStylesInjected = true;
}

function Skeleton({
  width = '100%',
  height = '20px',
  variant = 'text',
  borderRadius,
  count = 1,
  style = {},
  className = '',
  ...props
}) {
  injectSkeletonStyles();

  const variantMap = {
    text: { width: '100%', height: '16px', borderRadius: '4px' },
    heading: { width: '60%', height: '28px', borderRadius: '6px' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%' },
    thumbnail: { width: '100%', height: '200px', borderRadius: '12px' },
    button: { width: '120px', height: '40px', borderRadius: '8px' },
    card: { width: '100%', height: '300px', borderRadius: '16px' },
  };

  const variantStyle = variantMap[variant] || variantMap.text;

  const skeletonItemStyle = {
    background: `linear-gradient(90deg, #161222, #241E38, #161222)`,
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 2s ease-in-out infinite',
    borderRadius: borderRadius || variantStyle.borderRadius,
    width: width !== '100%' ? width : variantStyle.width,
    height: height !== '20px' ? height : variantStyle.height,
    ...style,
  };

  return (
    <div className={className} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            ...skeletonItemStyle,
            marginBottom: count > 1 && i < count - 1 ? '12px' : '0',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default Skeleton;
