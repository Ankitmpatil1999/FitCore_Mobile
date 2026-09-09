import React from 'react';

export default function Input({ label, icon, id, eyeAction, eyeIcon, forgotLink, ...props }) {
  return (
    <div className="input-group">
      <div className="label-row">
        {label && <label htmlFor={id}>{label}</label>}
        {forgotLink}
      </div>
      <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          typeof icon === 'string' ? (
            <img src={icon} alt="" className="input-icon-img" />
          ) : (
            <span className="input-icon-svg-wrap" style={{ position: 'absolute', left: '14px', zIndex: 2, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              {icon}
            </span>
          )
        )}
        <input id={id} className="form-input" {...props} />
        {eyeAction && (
          <button
            type="button"
            className="eye-btn"
            onClick={eyeAction}
            tabIndex={-1}
            disabled={props.disabled}
            aria-label="Toggle password visibility"
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              color: '#94a3b8',
              transition: 'color 0.2s ease',
              zIndex: 3
            }}
          >
            {typeof eyeIcon === 'string' ? (
              <img src={eyeIcon} alt="Toggle visibility" className="eye-icon-img" />
            ) : (
              eyeIcon
            )}
          </button>
        )}
      </div>
    </div>
  );
}
