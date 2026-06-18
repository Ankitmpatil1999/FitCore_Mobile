import React from 'react';

export default function Input({ label, icon, id, eyeAction, eyeIcon, forgotLink, ...props }) {
  return (
    <div className="input-group">
      <div className="label-row">
        {label && <label htmlFor={id}>{label}</label>}
        {forgotLink}
      </div>
      <div className="input-wrapper">
        {icon && <img src={icon} alt="" className="input-icon-img" />}
        <input id={id} className="form-input" {...props} />
        {eyeAction && (
          <button
            type="button"
            className="eye-btn"
            onClick={eyeAction}
            tabIndex={-1}
            disabled={props.disabled}
          >
            <img src={eyeIcon} alt="Toggle visibility" className="eye-icon-img" />
          </button>
        )}
      </div>
    </div>
  );
}
