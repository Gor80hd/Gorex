import { Toggle, Row, PathRow, SectionHeader } from './SettingsRows'
import type { ReactNode, CSSProperties } from 'react'
import type { Theme, ThemeMode, SettingsTab, AppConfig, EncodingSettings, GpuInfo, ToolInfo, ToolState, YoutubeAuth } from '../../domain'
import { errorMessage } from '../../domain'
import { EIGHT_BIT_ONLY_ENCODERS } from '../../features/encoding/encodingOptions'
import { useAudioCodecs } from '../../features/encoding/useAudioCodecs'
import { appStorage } from '../../storage'
import {
    GsSelect,
    DEFAULT_SETTINGS,
    CODEC_RF,
    ENCODER_PRESETS,
    initDefaultSettings,
    getDefaultSettingsForGpu,
    WEBM_COMPATIBLE_ENCODERS,
    WEBM_COMPATIBLE_AUDIO,
    ENCODER_DISABLED_FORMATS,
    NO_CRF_ENCODERS,
    ALPHA_CAPABLE_ENCODERS,
    MULTI_PASS_ENCODERS,
    getEncoderGroupsForPlatform,
    normalizeEncoderSettings,
} from '../../components/GlobalSettings/GlobalSettings'
import { useLanguage } from '../../i18n'
import './SettingsPage.scss'

import { useSettingsPage, getGpuMeta, createYtdlUpdateState, type SettingsPageProps } from './useSettingsPage'
function SettingsPage({ theme, themeMode, onThemeModeChange, accentTheme, onAccentThemeChange, onBack, appSettings, onSave, onOutputDirChange, initialTab, ytdlTool, onUpdateYtdl, onRefreshYtdl, twitchTool, onUpdateTwitch, onRefreshTwitch }: SettingsPageProps) {
    const audioCodecs = useAudioCodecs()
    const { t, lang, setLang, activeSection, setActiveSection, savedFlash, setSavedFlash, gpuInfo, setGpuInfo, TABS, appConfig, setAppConfig, enc, setEnc, cliStatus, setCliStatus, cliVersion, setCliVersion, cliPath, setCliPath, ytdlInfo, setYtdlInfo, ytdlUpdateState, setYtdlUpdateState, gorexUpdateState, setGorexUpdateState, youtubeAuthStatus, setYoutubeAuthStatus, youtubeAuthBusy, setYoutubeAuthBusy, youtubeAuthError, setYoutubeAuthError, resolvedOutputDir, setResolvedOutputDir, contentRef, sectionRefs, isScrollingRef, scrollToSection, refreshYoutubeAuthStatus, updateEnc, updateApp, getYtdlUpdateStageText, refreshYtdlInfo, handleSave, handleReset, handleBrowseOutputDir, handleResetOutputDir, handleBrowseCookiesFile, handleClearCookiesFile, handleCheckGorexUpdates, handleOpenGorexRelease, handleYoutubeLogin, handleExportYoutubeCookies, handleClearYoutubeAuth, handleUpdateYtdl, handleOpenTemp, showResetConfirm, setShowResetConfirm, handleClearCache, handleConfirmReset, rfTable, speedPresets, isMac, platformEncoderGroups, supportsMultiPass, isHWEncoder, isPassthru, effectiveYtdlInfo, effectiveYtdlUpdateState, ytdlVersionText, ytdlSourceText, ytdlUpdateProgress, ytdlUpdateBytesText, showYtdlUpdateProgress, ytdlUpdateIndeterminate, effectiveTwitchInfo, effectiveTwitchUpdateState, twitchVersionText, twitchSourceText, twitchUpdateProgress, twitchUpdateBytesText, showTwitchUpdateProgress, twitchUpdateIndeterminate, gorexVersionTag, gorexUpdateAvailable, sectionRef } = useSettingsPage({ theme, themeMode, onThemeModeChange, accentTheme, onAccentThemeChange, onBack, appSettings, onSave, onOutputDirChange, initialTab, ytdlTool, onUpdateYtdl, onRefreshYtdl, twitchTool, onUpdateTwitch, onRefreshTwitch })

    return (
        <>
        <div className={`sp-page ${theme}`}>

            {/* ── Header ── */}
            <div className="sp-header">
                <button className="sp-back-btn" onClick={onBack}>
                    <i className="bi bi-arrow-left"></i>
                    {t('back')}
                </button>
                <div className="sp-header-title">
                    <i className="bi bi-gear-fill"></i>
                    {t('settingsTitle')}
                </div>
                <div className="sp-header-actions">
                    <button className="sp-btn-reset" onClick={handleReset} title={t('settingsResetTitle')}>
                        <i className="bi bi-arrow-counterclockwise"></i>
                        {t('reset')}
                    </button>
                    <button className={`sp-btn-save${savedFlash ? ' saved' : ''}`} onClick={handleSave}>
                        {savedFlash
                            ? <><i className="bi bi-check-lg"></i>{t('saved')}</>
                            : <><i className="bi bi-floppy"></i>{t('save')}</>
                        }
                    </button>
                </div>
            </div>

            <div className="sp-body">

                {/* ── Sidebar ── */}
                <div className="sp-sidebar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`sp-tab${activeSection === tab.id ? ' active' : ''}`}
                            onClick={() => scrollToSection(tab.id)}
                        >
                            <i className={`bi ${tab.icon}`}></i>
                            {tab.label}
                        </button>
                    ))}
                    <div className="sp-sidebar-spacer"></div>
                    <p className="sp-sidebar-hint">
                        {t('settingsSidebarHint')}
                    </p>
                </div>

                {/* ── Content ── */}
                <div className="sp-content" ref={contentRef}>

                    {/* ══ APP ══ */}
                    <div className="sp-section" data-section="app" ref={sectionRef('app')}>
                        <SectionHeader icon="bi-palette" title={t('sectionAppearance')} />
                        <Row label={t('rowTheme')} hint={t('hintTheme')}>
                            <div className="sp-theme-selector">
                                {[
                                    { mode: 'dark',  icon: 'bi-moon-fill',     labelKey: 'themeDark' },
                                    { mode: 'light', icon: 'bi-sun-fill',      labelKey: 'themeLight' },
                                    { mode: 'auto',  icon: 'bi-circle-half',   labelKey: 'themeAuto' },
                                ].map(({ mode, icon, labelKey }) => (
                                    <button
                                        key={mode}
                                        className={`sp-theme-btn${themeMode === mode ? ' active' : ''}`}
                                        onClick={() => onThemeModeChange(mode as ThemeMode)}
                                        type="button"
                                    >
                                        <i className={`bi ${icon}`}></i>
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <Row label={t('rowAccentTheme')} hint={t('hintAccentTheme')}>
                            <div className="sp-color-dots">
                                {[
                                    { key: 'purple', color: '#7c3aed', labelKey: 'accentThemePurple' },
                                    { key: 'white',  color: '#ffffff', labelKey: 'accentThemeWhite'  },
                                ].map(({ key, color, labelKey }) => (
                                    <button
                                        key={key}
                                        className={`sp-color-dot${accentTheme === key ? ' active' : ''}`}
                                        style={{ '--dot-color': color } as CSSProperties}
                                        onClick={() => onAccentThemeChange(key)}
                                        type="button"
                                        title={t(labelKey)}
                                    />
                                ))}
                            </div>
                        </Row>

                        <SectionHeader icon="bi-translate" title={t('sectionLanguage')} />
                        <Row label={t('rowLanguage')} hint={t('hintLanguage')}>
                            <div className="sp-theme-selector">
                                {[
                                    { code: 'ru', labelKey: 'langRu' },
                                    { code: 'en', labelKey: 'langEn' },
                                ].map(({ code, labelKey }) => (
                                    <button
                                        key={code}
                                        className={`sp-theme-btn${lang === code ? ' active' : ''}`}
                                        onClick={() => setLang(code as 'ru' | 'en')}
                                        type="button"
                                    >
                                        {t(labelKey)}
                                    </button>
                                ))}
                            </div>
                        </Row>

                        <SectionHeader icon="bi-terminal" title={t('sectionCli')} />
                        <Row label={t('rowCliStatus')} hint={t('hintCliStatus')}>
                            {cliStatus === 'checking' && (
                                <span className="sp-cli-status sp-cli-status--checking">
                                    <i className="bi bi-arrow-repeat"></i> {t('cliChecking')}
                                </span>
                            )}
                            {cliStatus === 'ok' && (
                                <span className="sp-cli-status sp-cli-status--ok">
                                    <i className="bi bi-check-circle-fill"></i>
                                    {t('cliFound')}{cliVersion ? ` · v${cliVersion}` : ''}
                                </span>
                            )}
                            {cliStatus === 'error' && (
                                <span className="sp-cli-status sp-cli-status--error" title={cliPath}>
                                    <i className="bi bi-x-circle-fill"></i> {t('cliNotFound')}
                                </span>
                            )}
                        </Row>

                        <SectionHeader icon="bi-gpu-card" title={t('sectionGpu')} />
                        <div className="sp-gpu-widget">
                            {gpuInfo.gpus.length > 0 ? (
                                <>
                                    <div className="sp-gpu-items-row">
                                        {gpuInfo.gpus.map((gpu, i) => {
                                            const meta = getGpuMeta(gpu)
                                            const isPrimary = gpu === gpuInfo.primaryGpu
                                            return (
                                                <div key={i} className={`sp-gpu-item${isPrimary ? ' sp-gpu-item--primary' : ''}`}>
                                                    <span
                                                        className="sp-gpu-badge"
                                                        style={meta.color ? { color: meta.color, borderColor: meta.color + '40' } : {}}
                                                    >
                                                        <i className={`bi ${meta.icon}`}></i>
                                                        {meta.label || 'GPU'}
                                                    </span>
                                                    {isPrimary && <span className="sp-gpu-primary-dot"></span>}
                                                    <span className="sp-gpu-name">{gpu}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <span className="sp-gpu-hint">{t('gpuCodecHint')}</span>
                                </>
                            ) : (
                                <span className="sp-gpu-none">
                                    <i className="bi bi-question-circle"></i>
                                    {t('gpuUnknown')}
                                </span>
                            )}
                        </div>
                        <SectionHeader icon="bi-app-indicator" title={t('sectionBackgroundMode')} />
                        <Row label={t('rowBackgroundMode')} hint={t('hintBackgroundMode')}>
                            <Toggle
                                value={appConfig.backgroundMode !== false}
                                onChange={val => updateApp('backgroundMode', val)}
                            />
                        </Row>
                        <SectionHeader icon="bi-folder2" title={t('sectionOutputFolder')} />
                        <p className="sp-tab-description">{t('folderDesc')}</p>
                        <div className="sp-folder-widget">
                            <div className="sp-folder-widget__info">
                                <span className="sp-folder-widget__path">{resolvedOutputDir || '…'}</span>
                                {!appConfig.defaultOutputDir && (
                                    <span className="sp-folder-widget__tag">{t('folderDefault')}</span>
                                )}
                            </div>
                            <div className="sp-folder-widget__actions">
                                {appConfig.defaultOutputDir && (
                                    <button className="sp-folder-widget__reset" onClick={handleResetOutputDir} title={t('folderResetTitle')}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                                <button className="sp-folder-widget__browse" onClick={handleBrowseOutputDir}>
                                    <i className="bi bi-folder2-open"></i> {t('folderChange')}
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ══ VIDEO ══ */}
                    <div className="sp-section" data-section="video" ref={sectionRef('video')}>
                        <p className="sp-tab-description">{t('videoTabDesc')}</p>
                        <SectionHeader icon="bi-file-earmark-play" title={t('sectionContainer')} />
                        <Row label={t('rowFormat')} hint={t('hintFormat')}>
                            <GsSelect
                                value={enc.format}
                                options={(() => {
                                    const disabledSet = ENCODER_DISABLED_FORMATS[enc.encoder] || new Set()
                                    return [
                                        { value: 'av_mp4',  label: 'MP4',     disabled: disabledSet.has('av_mp4') },
                                        { value: 'av_mkv',  label: 'MKV' },
                                        { value: 'av_webm', label: 'WebM',    disabled: disabledSet.has('av_webm') },
                                        { value: 'av_mov',  label: 'MOV',     disabled: disabledSet.has('av_mov') },
                                        { value: 'av_avi',  label: 'AVI',     disabled: disabledSet.has('av_avi') },
                                        { value: 'av_ts',   label: 'MPEG-TS', disabled: disabledSet.has('av_ts') },
                                        { value: 'av_flv',  label: 'FLV',     disabled: disabledSet.has('av_flv') },
                                        { value: 'av_ogg',  label: 'OGG',     disabled: disabledSet.has('av_ogg') },
                                        { value: 'av_3gp',  label: '3GP',     disabled: disabledSet.has('av_3gp') },
                                    ]
                                })()}
                                onChange={v => {
                                    const patch: Partial<EncodingSettings> = { format: v }
                                    if (v === 'av_webm') {
                                        if (!WEBM_COMPATIBLE_ENCODERS.has(enc.encoder)) {
                                            const speeds = ENCODER_PRESETS.vp9
                                            patch.encoder = 'vp9'
                                            patch.encoderSpeed = speeds[Math.floor(speeds.length / 2)]?.value ?? 'good'
                                        }
                                        const audioCodec = enc.audioCodec || 'av_aac'
                                        if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                                            patch.audioCodec = 'opus'
                                        }
                                    } else if (v === 'av_ogg') {
                                        if (!new Set(['theora', 'vp8', 'vp9', 'vp9_10bit']).has(enc.encoder)) {
                                            patch.encoder = 'theora'
                                            patch.encoderSpeed = undefined
                                        }
                                        const audioCodec = enc.audioCodec || 'av_aac'
                                        if (!WEBM_COMPATIBLE_AUDIO.has(audioCodec) && !audioCodec.startsWith('copy')) {
                                            patch.audioCodec = 'vorbis'
                                        }
                                    } else if (v === 'av_flv') {
                                        if (!new Set(['flv1', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264']).has(enc.encoder)) {
                                            patch.encoder = 'flv1'
                                            patch.encoderSpeed = undefined
                                        }
                                    } else if (v === 'av_3gp') {
                                        if (!new Set(['h263', 'h263p', 'x264', 'x264_10bit', 'nvenc_h264', 'qsv_h264', 'vce_h264', 'mf_h264', 'vt_h264', 'mpeg4']).has(enc.encoder)) {
                                            patch.encoder = 'h263p'
                                            patch.encoderSpeed = undefined
                                        }
                                    }
                                    setEnc(prev => ({ ...prev, ...patch }))
                                }}
                            />
                        </Row>

                        <SectionHeader icon="bi-cpu" title={t('sectionEncoder')} />
                        <Row label={t('rowVideoCodec')} hint={t('hintVideoCodec')}>
                            <GsSelect
                                value={enc.encoder}
                                groups={platformEncoderGroups.map(g => ({
                                    label: g.labelKey ? t(g.labelKey) : g.label,
                                    options: g.encoders.map(e => ({
                                        value: e.value,
                                        label: e.label,
                                        disabled: ENCODER_DISABLED_FORMATS[e.value]?.has(enc.format) ||
                                            (enc.format === 'av_webm' && !WEBM_COMPATIBLE_ENCODERS.has(e.value)),
                                    }))
                                }))}
                                onChange={v => {
                                    setEnc(prev => normalizeEncoderSettings({ ...prev, encoder: v }))
                                }}
                            />
                        </Row>
                        {EIGHT_BIT_ONLY_ENCODERS.has(enc.encoder) && (
                            <div className="sp-notice sp-notice--warn">
                                <i className="bi bi-exclamation-triangle"></i>
                                {t('warn8bitEncoder')}
                            </div>
                        )}
                        {speedPresets.length > 0 && (
                            <Row label={t('rowSpeedPreset')} hint={t('hintSpeedPreset')}>
                                <GsSelect
                                    value={enc.encoderSpeed}
                                    options={speedPresets.map(sp => ({ value: sp.value, label: sp.label }))}
                                    onChange={v => updateEnc('encoderSpeed', v)}
                                />
                            </Row>
                        )}

                        <SectionHeader icon="bi-sliders2" title={t('sectionQuality')} />
                        {NO_CRF_ENCODERS.has(enc.encoder) ? (
                            <div className="sp-notice">
                                <i className="bi bi-info-circle"></i>
                                {['ffv1', 'huffyuv'].includes(enc.encoder)
                                    ? t('noCrfNoticeLossless')
                                    : t('noCrfNoticeProfile')
                                }
                            </div>
                        ) : (
                        <>
                        <Row label={t('rowQualityMode')} hint={t('hintQualityMode')}>
                            <GsSelect
                                value={enc.quality}
                                options={[
                                    { value: 'source', label: t('qualitySource') },
                                    { value: 'high',   label: `${t('qualityHigh')} (RF ${rfTable.high})` },
                                    { value: 'medium', label: `${t('qualityMedium')} (RF ${rfTable.medium})` },
                                    { value: 'low',    label: `${t('qualityLow')} (RF ${rfTable.low})` },
                                    { value: 'potato', label: `${t('qualityPotato')} (RF ${rfTable.potato})` },
                                    { value: 'custom', label: enc.quality === 'custom' ? `${t('qualityCustomLabel')} (RF ${enc.customQuality})` : t('qualityCustomEmpty') },
                                ]}
                                onChange={v => updateEnc('quality', v)}
                            />
                        </Row>
                        {enc.quality === 'custom' && (
                            <Row
                                label={`RF / CRF: ${enc.customQuality}`}
                                hint={`${t('rfRange')} ${rfTable.min} (${t('rfBetter')}) — ${rfTable.max} (${t('rfWorse')})`}
                            >
                                <div className="sp-slider-wrap">
                                    <span className="sp-slider-edge">{rfTable.min}</span>
                                    <input
                                        type="range"
                                        className="sp-slider"
                                        min={rfTable.min}
                                        max={rfTable.max}
                                        step={1}
                                        value={enc.customQuality}
                                        onChange={e => updateEnc('customQuality', Number(e.target.value))}
                                    />
                                    <span className="sp-slider-edge">{rfTable.max}</span>
                                </div>
                            </Row>
                        )}
                        </>
                        )}

                        <SectionHeader icon="bi-aspect-ratio" title={t('sectionResFps')} />
                        <Row label={t('rowResolution')} hint={t('hintResolution')}>
                            <GsSelect
                                value={enc.resolution}
                                options={[
                                    { value: 'source', label: t('resSource') },
                                    { value: '4k',     label: '4K (2160p)' },
                                    { value: '1440p',  label: '2K (1440p)' },
                                    { value: '1080p',  label: '1080p (Full HD)' },
                                    { value: '720p',   label: '720p (HD)' },
                                    { value: '480p',   label: '480p (SD)' },
                                ]}
                                onChange={v => updateEnc('resolution', v)}
                            />
                        </Row>
                        <Row label={t('rowFps')} hint={t('hintFps')}>
                            <GsSelect
                                value={enc.fps}
                                options={[
                                    { value: 'source', label: t('fpsSource') },
                                    { value: '60',     label: '60 fps' },
                                    { value: '30',     label: '30 fps' },
                                    { value: '25',     label: '25 fps (PAL)' },
                                    { value: '24',     label: t('fpsCinema') },
                                    { value: '23.976', label: '23.976 fps (NTSC)' },
                                ]}
                                onChange={v => updateEnc('fps', v)}
                            />
                        </Row>
                        <Row label={t('rowFpsMode')} hint={t('hintFpsMode')}>
                            <GsSelect
                                value={enc.fpsMode || 'vfr'}
                                options={[
                                    { value: 'vfr', label: t('fpsVfr') },
                                    { value: 'cfr', label: t('fpsCfr') },
                                    { value: 'pfr', label: t('fpsPfr') },
                                ]}
                                onChange={v => updateEnc('fpsMode', v)}
                            />
                        </Row>

                        {(!isMac || supportsMultiPass) && (
                            <SectionHeader icon="bi-lightning-charge" title={t('sectionHwAccel')} />
                        )}
                        {!isMac && (
                            <Row label={t('rowHwDecoding')} hint={t('hintHwDecoding')}>
                                <GsSelect
                                    value={enc.hwDecoding || 'none'}
                                    options={[
                                        { value: 'none',  label: t('hwDecodingNone') },
                                        { value: 'videotoolbox', label: 'VideoToolbox (Apple)' },
                                        { value: 'nvdec', label: 'NVDEC (NVIDIA)' },
                                        { value: 'qsv',   label: 'Quick Sync (Intel)' },
                                    ]}
                                    onChange={v => updateEnc('hwDecoding', v)}
                                />
                            </Row>
                        )}
                        {supportsMultiPass && (
                            <Row label={t('rowMultiPass')} hint={t('hintMultiPass')}>
                                <Toggle value={!!enc.multiPass} onChange={v => updateEnc('multiPass', v)} />
                            </Row>
                        )}

                        <SectionHeader icon="bi-layers" title={t('rowAlphaChannel')} />
                        <Row
                            label={t('rowAlphaChannel')}
                            hint={ALPHA_CAPABLE_ENCODERS.has(enc.encoder) ? t('hintAlphaChannel') : t('hintAlphaNoSupport')}
                        >
                            <Toggle
                                value={!!enc.alphaChannel}
                                onChange={v => updateEnc('alphaChannel', v)}
                                disabled={!ALPHA_CAPABLE_ENCODERS.has(enc.encoder)}
                            />
                        </Row>
                    </div>

                    {/* ══ AUDIO ══ */}
                    <div className="sp-section" data-section="audio" ref={sectionRef('audio')}>
                        <SectionHeader icon="bi-music-note-beamed" title={t('sectionAudioCodec')} />
                        <Row label={t('rowAudioCodec')} hint={t('hintAudioCodec')}>
                            <GsSelect
                                value={enc.audioCodec || 'av_aac'}
                                options={audioCodecs.map(c => ({
                                    ...c,
                                    disabled: c.disabled || enc.format === 'av_webm' && !WEBM_COMPATIBLE_AUDIO.has(c.value) && !c.value.startsWith('copy'),
                                }))}
                                onChange={v => updateEnc('audioCodec', v)}
                            />
                        </Row>

                        {!isPassthru && (
                            <>
                                <SectionHeader icon="bi-speaker" title={t('sectionAudioParams')} />
                                <Row label={t('rowBitrate')} hint={t('hintBitrate')}>
                                    <GsSelect
                                        value={enc.audioBitrate || '160'}
                                        options={[
                                            { value: '64',  label: '64 kbps' },
                                            { value: '96',  label: '96 kbps' },
                                            { value: '128', label: '128 kbps' },
                                            { value: '160', label: `160 kbps (${t('bitrateDefault')})` },
                                            { value: '192', label: '192 kbps' },
                                            { value: '256', label: '256 kbps' },
                                            { value: '320', label: '320 kbps' },
                                        ]}
                                        onChange={v => updateEnc('audioBitrate', v)}
                                    />
                                </Row>
                                <Row label={t('rowMixdown')} hint={t('hintMixdown')}>
                                    <GsSelect
                                        value={enc.audioMixdown || 'stereo'}
                                        options={[
                                            { value: 'mono',    label: t('mixMono') },
                                            { value: 'stereo',  label: t('mixStereo') },
                                            { value: 'dpl2',    label: 'Dolby Pro Logic II' },
                                            { value: '5point1', label: 'Surround 5.1' },
                                            { value: '6point1', label: 'Surround 6.1' },
                                            { value: '7point1', label: 'Surround 7.1' },
                                        ]}
                                        onChange={v => updateEnc('audioMixdown', v)}
                                    />
                                </Row>
                                <Row label={t('rowSampleRate')} hint={t('hintSampleRate')}>
                                    <GsSelect
                                        value={enc.audioSampleRate || 'auto'}
                                        options={[
                                            { value: 'auto',  label: t('srAuto') },
                                            { value: '22.05', label: '22.05 kHz' },
                                            { value: '32',    label: '32 kHz' },
                                            { value: '44.1',  label: '44.1 kHz' },
                                            { value: '48',    label: '48 kHz' },
                                            { value: '96',    label: '96 kHz' },
                                        ]}
                                        onChange={v => updateEnc('audioSampleRate', v)}
                                    />
                                </Row>
                            </>
                        )}

                        <SectionHeader icon="bi-collection-play" title={t('sectionFileMetadata')} />
                        <Row label={t('rowChapterMarkers')} hint={t('hintChapterMarkers')}>
                            <Toggle value={enc.chapterMarkers !== false} onChange={v => updateEnc('chapterMarkers', v)} />
                        </Row>
                        <Row label={t('rowOptimizeMp4')} hint={t('hintOptimizeMp4')}>
                            <Toggle
                                value={!!enc.optimizeMP4}
                                onChange={v => updateEnc('optimizeMP4', v)}
                                disabled={enc.format !== 'av_mp4'}
                            />
                        </Row>

                        <SectionHeader icon="bi-cloud-arrow-down" title={t('sectionDownloadDefaults')} />
                        <Row label={t('rowDefaultAudioFormat')} hint={t('hintDefaultAudioFormat')}>
                            <GsSelect
                                value={appConfig.defaultAudioFormat || 'wav'}
                                options={[
                                    { value: 'best',   label: t('audioFmtBest') },
                                    { value: 'mp3',    label: t('audioFmtMp3') },
                                    { value: 'm4a',    label: t('audioFmtM4a') },
                                    { value: 'flac',   label: t('audioFmtFlac') },
                                    { value: 'opus',   label: t('audioFmtOpus') },
                                    { value: 'wav',    label: t('audioFmtWav') },
                                    { value: 'vorbis', label: t('audioFmtOgg') },
                                ]}
                                onChange={v => updateApp('defaultAudioFormat', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ SUBTITLES ══ */}
                    <div className="sp-section" data-section="subtitles" ref={sectionRef('subtitles')}>
                        <SectionHeader icon="bi-badge-cc" title={t('sectionSubtitleTracks')} />
                        <Row label={t('rowSubtitles')} hint={t('hintSubtitles')}>
                            <GsSelect
                                value={enc.subtitleMode || 'none'}
                                options={[
                                    { value: 'none',         label: t('subNone') },
                                    { value: 'first',        label: t('subFirst') },
                                    { value: 'all',          label: t('subAll') },
                                    { value: 'scan_forced',  label: t('subScanForced') },
                                ]}
                                onChange={v => updateEnc('subtitleMode', v)}
                            />
                        </Row>
                        {enc.subtitleMode !== 'none' && enc.subtitleMode !== 'all' && (
                            <Row label={t('rowSubtitleBurn')} hint={t('hintSubtitleBurn')}>
                                <Toggle value={!!enc.subtitleBurn} onChange={v => updateEnc('subtitleBurn', v)} />
                            </Row>
                        )}
                        {enc.subtitleMode !== 'none' && !enc.subtitleBurn && enc.subtitleMode !== 'all' && (
                            <Row label={t('rowSubtitleDefault')} hint={t('hintSubtitleDefault')}>
                                <Toggle value={!!enc.subtitleDefault} onChange={v => updateEnc('subtitleDefault', v)} />
                            </Row>
                        )}

                        <SectionHeader icon="bi-translate" title={t('sectionSubtitleLang')} />
                        <Row label={t('rowSubtitleLang')} hint={t('hintSubtitleLang')}>
                            <GsSelect
                                value={enc.subtitleLanguage || 'any'}
                                options={[
                                    { value: 'any', label: t('subLangAny') },
                                    { value: 'eng', label: t('subLangEng') },
                                    { value: 'rus', label: t('subLangRus') },
                                    { value: 'jpn', label: t('subLangJpn') },
                                    { value: 'chi', label: t('subLangChi') },
                                    { value: 'kor', label: t('subLangKor') },
                                    { value: 'fra', label: t('subLangFra') },
                                    { value: 'deu', label: t('subLangDeu') },
                                    { value: 'spa', label: t('subLangSpa') },
                                    { value: 'por', label: t('subLangPor') },
                                    { value: 'ita', label: t('subLangIta') },
                                    { value: 'ara', label: t('subLangAra') },
                                ]}
                                onChange={v => updateEnc('subtitleLanguage', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ FILTERS ══ */}
                    <div className="sp-section" data-section="filters" ref={sectionRef('filters')}>
                        <SectionHeader icon="bi-intersect" title={t('sectionDeinterlace')} />
                        <Row label={t('rowDeinterlace')} hint={t('hintDeinterlace')}>
                            <GsSelect
                                value={enc.deinterlace || 'off'}
                                options={[
                                    { value: 'off',           label: t('deintOff') },
                                    { value: 'yadif_default', label: t('deintYadif') },
                                    { value: 'yadif_bob',     label: t('deintYadifBob') },
                                    { value: 'bwdif_default', label: t('deintBwdif') },
                                    { value: 'bwdif_bob',     label: t('deintBwdifBob') },
                                ]}
                                onChange={v => updateEnc('deinterlace', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-snow2" title={t('sectionDenoise')} />
                        <Row label={t('rowDenoise')} hint={t('hintDenoise')}>
                            <GsSelect
                                value={enc.denoise || 'off'}
                                options={[
                                    { value: 'off',                label: t('denoiseOff') },
                                    { value: 'nlmeans_ultralight', label: t('denoiseNlUltralight') },
                                    { value: 'nlmeans_light',      label: t('denoiseNlLight') },
                                    { value: 'nlmeans_medium',     label: t('denoiseNlMedium') },
                                    { value: 'nlmeans_strong',     label: t('denoiseNlStrong') },
                                    { value: 'hqdn3d_light',       label: t('denoiseHqLight') },
                                    { value: 'hqdn3d_medium',      label: t('denoiseHqMedium') },
                                    { value: 'hqdn3d_strong',      label: t('denoiseHqStrong') },
                                ]}
                                onChange={v => updateEnc('denoise', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-grid-3x3" title={t('sectionDeblock')} />
                        <Row label={t('rowDeblock')} hint={t('hintDeblock')}>
                            <GsSelect
                                value={enc.deblock || 'off'}
                                options={[
                                    { value: 'off',        label: t('deblockOff') },
                                    { value: 'ultralight', label: t('deblockUltralight') },
                                    { value: 'light',      label: t('deblockLight') },
                                    { value: 'medium',     label: t('deblockMedium') },
                                    { value: 'strong',     label: t('deblockStrong') },
                                    { value: 'stronger',   label: t('deblockStronger') },
                                ]}
                                onChange={v => updateEnc('deblock', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-zoom-in" title={t('sectionSharpen')} />
                        <Row label={t('rowSharpen')} hint={t('hintSharpen')}>
                            <GsSelect
                                value={enc.sharpen || 'off'}
                                options={[
                                    { value: 'off',                 label: t('sharpenOff') },
                                    { value: 'unsharp_ultralight',  label: t('sharpenUnsharpUltralight') },
                                    { value: 'unsharp_light',       label: t('sharpenUnsharpLight') },
                                    { value: 'unsharp_medium',      label: t('sharpenUnsharpMedium') },
                                    { value: 'unsharp_strong',      label: t('sharpenUnsharpStrong') },
                                    { value: 'lapsharp_ultralight', label: t('sharpenLapUltralight') },
                                    { value: 'lapsharp_light',      label: t('sharpenLapLight') },
                                    { value: 'lapsharp_medium',     label: t('sharpenLapMedium') },
                                    { value: 'lapsharp_strong',     label: t('sharpenLapStrong') },
                                ]}
                                onChange={v => updateEnc('sharpen', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-camera" title={t('sectionFrameTransform')} />
                        <Row label={t('rowGrayscale')} hint={t('hintGrayscale')}>
                            <Toggle value={!!enc.grayscale} onChange={v => updateEnc('grayscale', v)} />
                        </Row>
                        <Row label={t('rowRotate')} hint={t('hintRotate')}>
                            <GsSelect
                                value={enc.rotate || '0'}
                                options={[
                                    { value: '0',     label: t('rotateNone') },
                                    { value: '90',    label: t('rotate90') },
                                    { value: '180',   label: t('rotate180') },
                                    { value: '270',   label: t('rotate270') },
                                    { value: 'hflip', label: t('rotateHflip') },
                                ]}
                                onChange={v => updateEnc('rotate', v)}
                            />
                        </Row>
                    </div>

                    {/* ══ HDR / META ══ */}
                    <div className="sp-section" data-section="hdr" ref={sectionRef('hdr')}>
                        <SectionHeader icon="bi-brightness-high" title={t('sectionHdr')} />
                        <Row label={t('rowHdrMetadata')} hint={t('hintHdrMetadata')}>
                            <GsSelect
                                value={enc.hdrMetadata || 'off'}
                                options={[
                                    { value: 'off',         label: t('hdrOff') },
                                    { value: 'hdr10plus',   label: 'HDR10+' },
                                    { value: 'dolbyvision', label: 'Dolby Vision' },
                                    { value: 'all',         label: t('hdrAll') },
                                ]}
                                onChange={v => updateEnc('hdrMetadata', v)}
                            />
                        </Row>

                        <SectionHeader icon="bi-tag" title={t('sectionFileMeta')} />
                        <Row label={t('rowKeepMetadata')} hint={t('hintKeepMetadata')}>
                            <Toggle value={!!enc.keepMetadata} onChange={v => updateEnc('keepMetadata', v)} />
                        </Row>
                        <Row label={t('rowInlineParamSets')} hint={t('hintInlineParamSets')}>
                            <Toggle value={!!enc.inlineParamSets} onChange={v => updateEnc('inlineParamSets', v)} />
                        </Row>
                    </div>

                    {/* ══ UPDATES ══ */}
                    <div className="sp-section" data-section="updates" ref={sectionRef('updates')}>
                        <SectionHeader icon="bi-arrow-repeat" title={t('sectionGorexUpdates')} />
                        <div className="sp-ytdl-tool">
                            <div className="sp-folder-widget">
                                <div className="sp-folder-widget__info">
                                    <span className="sp-folder-widget__path">{t('gorexUpdateTitle')}</span>
                                    <span className="sp-folder-widget__tag">{gorexVersionTag}</span>
                                </div>
                                <div className="sp-folder-widget__actions">
                                    <button
                                        className={`sp-folder-widget__browse${gorexUpdateState.status === 'checking' ? ' is-loading' : ''}`}
                                        onClick={handleCheckGorexUpdates}
                                        disabled={gorexUpdateState.status === 'checking'}
                                    >
                                        <i className="bi bi-arrow-repeat"></i>
                                        {gorexUpdateState.status === 'checking' ? t('gorexUpdateChecking') : t('gorexUpdateButton')}
                                    </button>
                                    {gorexUpdateAvailable && (
                                        <button className="sp-folder-widget__browse" onClick={handleOpenGorexRelease}>
                                            <i className="bi bi-box-arrow-up-right"></i>
                                            {t('gorexUpdateOpenRelease')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {gorexUpdateState.message && (
                                <div className={`sp-ytdl-update-msg ${gorexUpdateState.status}`}>
                                    {gorexUpdateState.message}
                                </div>
                            )}
                        </div>

                        <SectionHeader icon="bi-cloud-arrow-down" title={t('sectionYtdlTools')} />
                        <div className="sp-ytdl-tool">
                            <div className="sp-folder-widget">
                                <div className="sp-folder-widget__info">
                                    <span className="sp-folder-widget__path">
                                        {ytdlVersionText}
                                    </span>
                                    <span className="sp-folder-widget__tag">
                                        {ytdlSourceText}
                                    </span>
                                </div>
                                <div className="sp-folder-widget__actions">
                                    <button
                                        className={`sp-folder-widget__browse${effectiveYtdlUpdateState.status === 'updating' ? ' is-loading' : ''}`}
                                        onClick={onUpdateYtdl || handleUpdateYtdl}
                                        disabled={effectiveYtdlUpdateState.status === 'updating'}
                                    >
                                        <i className="bi bi-arrow-repeat"></i>
                                        {effectiveYtdlUpdateState.status === 'updating' ? t('ytdlUpdateChecking') : t('ytdlUpdateButton')}
                                    </button>
                                </div>
                            </div>
                            {effectiveYtdlUpdateState.message && (
                                <div className={`sp-ytdl-update-msg ${effectiveYtdlUpdateState.status}`}>
                                    {effectiveYtdlUpdateState.message}
                                </div>
                            )}
                            {showYtdlUpdateProgress && (
                                <div className={`sp-ytdl-update-progress ${effectiveYtdlUpdateState.status}${ytdlUpdateIndeterminate ? ' is-indeterminate' : ''}`}>
                                    <div className="sp-ytdl-update-progress__meta">
                                        <span>{effectiveYtdlUpdateState.stageMessage || t('ytdlUpdateChecking')}</span>
                                        <span>
                                            {ytdlUpdateProgress !== null ? `${ytdlUpdateProgress}%` : t('ytdlUpdateProgressUnknown')}
                                            {ytdlUpdateBytesText ? ` · ${ytdlUpdateBytesText}` : ''}
                                        </span>
                                    </div>
                                    <div className="sp-ytdl-update-progress__track">
                                        <div
                                            className="sp-ytdl-update-progress__fill"
                                            style={{ width: `${ytdlUpdateProgress ?? 35}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sp-ytdl-tool sp-ytdl-tool--twitch">
                            <div className="sp-folder-widget">
                                <div className="sp-folder-widget__info">
                                    <span className="sp-folder-widget__path">
                                        {twitchVersionText}
                                    </span>
                                    <span className="sp-folder-widget__tag">
                                        {twitchSourceText}
                                    </span>
                                </div>
                                <div className="sp-folder-widget__actions">
                                    <button
                                        className={`sp-folder-widget__browse${effectiveTwitchUpdateState.status === 'updating' ? ' is-loading' : ''}`}
                                        onClick={onUpdateTwitch || onRefreshTwitch}
                                        disabled={effectiveTwitchUpdateState.status === 'updating' || (!onUpdateTwitch && !onRefreshTwitch)}
                                    >
                                        <i className="bi bi-arrow-repeat"></i>
                                        {effectiveTwitchUpdateState.status === 'updating' ? t('ytdlUpdateChecking') : t('twitchUpdateButton')}
                                    </button>
                                </div>
                            </div>
                            {effectiveTwitchUpdateState.message && (
                                <div className={`sp-ytdl-update-msg ${effectiveTwitchUpdateState.status}`}>
                                    {effectiveTwitchUpdateState.message}
                                </div>
                            )}
                            {showTwitchUpdateProgress && (
                                <div className={`sp-ytdl-update-progress ${effectiveTwitchUpdateState.status}${twitchUpdateIndeterminate ? ' is-indeterminate' : ''}`}>
                                    <div className="sp-ytdl-update-progress__meta">
                                        <span>{effectiveTwitchUpdateState.stageMessage || t('ytdlUpdateChecking')}</span>
                                        <span>
                                            {twitchUpdateProgress !== null ? `${twitchUpdateProgress}%` : t('ytdlUpdateProgressUnknown')}
                                            {twitchUpdateBytesText ? ` · ${twitchUpdateBytesText}` : ''}
                                        </span>
                                    </div>
                                    <div className="sp-ytdl-update-progress__track">
                                        <div
                                            className="sp-ytdl-update-progress__fill"
                                            style={{ width: `${twitchUpdateProgress ?? 35}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* ══ OTHER ══ */}
                    <div className="sp-section" data-section="other" ref={sectionRef('other')}>
                        <SectionHeader icon="bi-folder-symlink" title={t('sectionTempFiles')} />
                        <div className="sp-other-row">
                            <div className="sp-other-info">
                                <span className="sp-other-label">{t('openTempFolder')}</span>
                                <span className="sp-other-hint">{t('hintOpenTempFolder')}</span>
                            </div>
                            <button className="sp-other-btn" onClick={handleOpenTemp}>
                                <i className="bi bi-folder2-open"></i>
                                {t('openTempFolder')}
                            </button>
                        </div>

                        <SectionHeader icon="bi-arrow-counterclockwise" title={t('sectionResetData')} />
                        <div className="sp-other-row">
                            <div className="sp-other-info">
                                <span className="sp-other-label">{t('clearCacheLabel')}</span>
                                <span className="sp-other-hint">{t('hintClearCache')}</span>
                            </div>
                            <button className="sp-other-btn sp-other-btn--danger" onClick={handleClearCache}>
                                <i className="bi bi-trash3"></i>
                                {t('clearCacheLabel')}
                            </button>
                        </div>

                        <SectionHeader icon="bi-cookie" title={t('sectionYtdlCookies')} />
                        <div className="sp-ytdl-guide">
                            <p className="sp-ytdl-guide__intro">{t('ytdlGuideIntro')}</p>
                            <ol className="sp-ytdl-guide__steps">
                                <li>{t('ytdlGuideStep1')}</li>
                                <li>{t('ytdlGuideStep2')}</li>
                                <li>{t('ytdlGuideStep3')}</li>
                            </ol>
                        </div>
                        <div className="sp-youtube-auth">
                            <div className="sp-youtube-auth__status">
                                <span className={`sp-youtube-auth__dot${youtubeAuthStatus?.signedIn ? ' is-on' : ''}`}></span>
                                <div>
                                    <span className="sp-youtube-auth__title">
                                        {youtubeAuthStatus?.signedIn ? t('youtubeAuthConnected') : t('youtubeAuthNotConnected')}
                                    </span>
                                    <span className="sp-youtube-auth__meta">
                                        {youtubeAuthStatus?.lastExportAt || appConfig.ytdlAuthLastExportAt
                                            ? `${t('youtubeAuthLastExport')}: ${new Date(youtubeAuthStatus?.lastExportAt || appConfig.ytdlAuthLastExportAt || 0).toLocaleString()}`
                                            : t('youtubeAuthNoExport')}
                                    </span>
                                </div>
                            </div>
                            <div className="sp-youtube-auth__mode">
                                <button
                                    type="button"
                                    className={appConfig.ytdlCookiesMode !== 'off' ? 'active' : ''}
                                    onClick={() => updateApp('ytdlCookiesMode', 'auto')}
                                >
                                    {t('youtubeAuthAutoMode')}
                                </button>
                                <button
                                    type="button"
                                    className={appConfig.ytdlCookiesMode === 'off' ? 'active' : ''}
                                    onClick={() => updateApp('ytdlCookiesMode', 'off')}
                                >
                                    {t('youtubeAuthOffMode')}
                                </button>
                            </div>
                            <div className="sp-youtube-auth__actions">
                                <button type="button" onClick={handleYoutubeLogin} disabled={youtubeAuthBusy}>
                                    <i className="bi bi-google"></i>{t('youtubeAuthLogin')}
                                </button>
                                <button type="button" onClick={handleExportYoutubeCookies} disabled={youtubeAuthBusy}>
                                    <i className="bi bi-file-earmark-lock"></i>{t('youtubeAuthExport')}
                                </button>
                                <button type="button" onClick={handleClearYoutubeAuth} disabled={youtubeAuthBusy}>
                                    <i className="bi bi-trash3"></i>{t('youtubeAuthClear')}
                                </button>
                            </div>
                            {youtubeAuthError && <div className="sp-youtube-auth__error">{youtubeAuthError}</div>}
                        </div>
                        <div className="sp-ytdl-file">
                            <div className="sp-folder-widget">
                                <div className="sp-folder-widget__info">
                                    <span className="sp-folder-widget__path">
                                        {appConfig.ytdlCookiesFile
                                            ? appConfig.ytdlCookiesFile.split(/[\\/]/).pop()
                                            : t('ytdlCookiesFileNone')}
                                    </span>
                                    {!appConfig.ytdlCookiesFile && (
                                        <span className="sp-folder-widget__tag">{t('ytdlCookiesFileNoneTag')}</span>
                                    )}
                                </div>
                                <div className="sp-folder-widget__actions">
                                    {appConfig.ytdlCookiesFile && (
                                        <button className="sp-folder-widget__reset" onClick={handleClearCookiesFile} title={t('cancel')}>
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    )}
                                    <button className="sp-folder-widget__browse" onClick={handleBrowseCookiesFile}>
                                        <i className="bi bi-file-earmark-text"></i> {t('ytdlCookiesFileBrowse')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {showResetConfirm && (
            <div className="sp-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
                <div className={`sp-confirm-popup ${theme}`} onClick={e => e.stopPropagation()}>
                    <div className="sp-confirm-icon">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <h3 className="sp-confirm-title">{t('resetConfirmTitle')}</h3>
                    <p className="sp-confirm-text">{t('resetConfirmText')}</p>
                    <div className="sp-confirm-btns">
                        <button className="sp-confirm-cancel" onClick={() => setShowResetConfirm(false)}>
                            {t('cancel')}
                        </button>
                        <button className="sp-confirm-ok" onClick={handleConfirmReset}>
                            <i className="bi bi-arrow-counterclockwise"></i>
                            {t('resetConfirmOk')}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default SettingsPage
