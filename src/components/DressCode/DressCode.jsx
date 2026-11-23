import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SectionWrapper from '../ui/SectionWrapper';
import OrnamentDivider from '../ui/OrnamentDivider';
import { ThemeHeaderCrest } from '../ui/ThemeVisuals';
import weddingConfig from '../../config/weddingConfig';
import useWeddingConfig from '../../hooks/useWeddingConfig';
import { resolveDressCodeForDisplay } from '../../config/dressCodeConfig';
import './DressCode.css';

const SuitIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2L10 6L14 2L18 6V22H6V6L10 2Z" />
    <path d="M10 6L12 11L14 6" />
    <line x1="12" y1="11" x2="12" y2="22" />
    <circle cx="12" cy="14" r="0.5" fill="currentColor" />
    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
  </svg>
);

const DressIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 2L12 5L15 2L18 8L15 13L19 22H5L9 13L6 8L9 2Z" />
    <path d="M12 5V13" />
  </svg>
);

const DressCode = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const liveConfig = useWeddingConfig() || weddingConfig;

  const isDressCodeEnabled =
    liveConfig.dressCode?.enabled !== false && liveConfig.sections?.dressCode?.enabled !== false;

  if (!isDressCodeEnabled) return null;

  const {
    sectionTitle,
    sectionSubtitle,
    gentlemenTitle,
    gentlemenDesc,
    ladiesTitle,
    ladiesDesc,
    noteTitle,
    noteDesc,
    menColors,
    womenColors,
    ladiesSolidShade,
    paletteLabelLadies,
  } = resolveDressCodeForDisplay(liveConfig, t, isAr);

  return (
    <SectionWrapper id="dress-code" alt>
      <div className="section__header">
        <ThemeHeaderCrest sectionIndex="07" />
        <h2 className="section__title font-serif">{sectionTitle}</h2>
        <p className="section__subtitle">{sectionSubtitle}</p>
        <OrnamentDivider symbol="✦" />
      </div>

      <div className="dress-code-grid">
        <motion.div
          className="dress-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="dress-card__inner">
            <div className="dress-card__header">
              <span className="dress-card__icon" aria-hidden="true">
                <SuitIcon />
              </span>
              <h3 className="dress-card__title font-serif">{gentlemenTitle}</h3>
            </div>

            <p className="dress-card__desc">{gentlemenDesc}</p>

            <OrnamentDivider symbol="❧" className="dress-card__sep" />

            <div className="palette-wrap">
              <span className="palette-label font-serif">
                {isAr ? 'درجات الألوان الموصى بها:' : 'Suggested Tone Palette:'}
              </span>
              <div className="palette-swatches">
                {menColors.map((c, i) => (
                  <div key={i} className="swatch-item" title={isAr ? c.nameAr : c.nameEn}>
                    <span
                      className="swatch-circle"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="swatch-name">{isAr ? c.nameAr : c.nameEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="dress-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <div className="dress-card__inner">
            <div className="dress-card__header">
              <span className="dress-card__icon dress-card__icon--rose" aria-hidden="true">
                <DressIcon />
              </span>
              <h3 className="dress-card__title font-serif">{ladiesTitle}</h3>
            </div>

            <p className="dress-card__desc">{ladiesDesc}</p>

            <OrnamentDivider symbol="❧" className="dress-card__sep" />

            <div className="palette-wrap">
              <span className="palette-label font-serif">
                {paletteLabelLadies}
              </span>
              {ladiesSolidShade ? (
                <div className="palette-featured-shade" data-shade-id={ladiesSolidShade.id}>
                  <span
                    className="swatch-circle swatch-circle--featured"
                    style={{ backgroundColor: ladiesSolidShade.hex }}
                    aria-label={isAr ? ladiesSolidShade.nameAr : ladiesSolidShade.nameEn}
                  />
                  <div className="palette-featured-shade__meta">
                    <span className="palette-featured-shade__name font-serif">
                      {isAr ? ladiesSolidShade.nameAr : ladiesSolidShade.nameEn}
                    </span>
                    <span className="palette-featured-shade__tag">
                      {isAr ? 'لون سادة موحّد' : 'Solid Brown Shade'} · {ladiesSolidShade.hex}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="palette-swatches">
                  {womenColors.map((c, i) => (
                    <div key={i} className="swatch-item" title={isAr ? c.nameAr : c.nameEn}>
                      <span
                        className="swatch-circle"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="swatch-name">{isAr ? c.nameAr : c.nameEn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="dress-code-note"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <span className="dress-code-note__icon" aria-hidden="true">🤍</span>
        <div className="dress-code-note__text">
          <strong className="dress-code-note__title">{noteTitle}</strong>
          <p className="dress-code-note__desc">{noteDesc}</p>
        </div>
      </motion.div>
    </SectionWrapper>
  );
};

export default DressCode;
