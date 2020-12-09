import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { closeIcon } from '../../assets/icons/shared';
import styles from './styles.module.css';

const Popup = ({
  children,
  isOpened,
  setOpen,
  header,
  close,
  containerStyles,
  modalContainerStyles,
  formContentStyles,
}) => {
  useEffect(() => {
    if (isOpened) {
      document.body.style.overflowY = 'hidden';
      document.body.style.height = '100%';
      document.body.style.width = '100%';
    } else {
      document.body.style.position = 'static';
      document.body.style.overflowY = 'auto';
    }
  }, [isOpened]);

  const closePopup = () => {
    document.body.style.position = 'static';
    document.body.style.overflowY = 'auto';
    setOpen(false);
  };

  return (
    isOpened && (
      <div className={styles.container} onClick={closePopup} style={containerStyles}>
        <div
          className={`${styles.modalContainer}`}
          onClick={(e) => e.stopPropagation()}
          style={modalContainerStyles}
        >
          {header && (
            <div className={styles.header}>
              <p className={styles.headerText}>{header}</p>
              {close && (
                <div onClick={closePopup}>
                  <img src={closeIcon} className={styles.close} alt="close" />
                </div>
              )}
            </div>
          )}
          <div className={styles.formContent} style={formContentStyles}>
            {children}
          </div>
        </div>
      </div>
    )
  );
};

Popup.propTypes = {
  children: PropTypes.node.isRequired,
  isOpened: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  header: PropTypes.string,
  close: PropTypes.bool,
  containerStyles: PropTypes.object,
  modalContainerStyles: PropTypes.object,
  formContentStyles: PropTypes.object,
};
Popup.defaultProps = {
  header: null,
  close: false,
  containerStyles: {},
  modalContainerStyles: {},
  formContentStyles: {},
};

export default Popup;
