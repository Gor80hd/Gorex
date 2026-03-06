import logoWhite from '../../assets/images/logo_white.svg'
import logoDark from '../../assets/images/logo.svg'
import './SourcePage.scss'

function SourcePage({ theme, isDragging, onSelectFiles, onDragOver, onDragLeave, onDrop }) {
    return (
        <div
            className={`drop-area ${isDragging ? 'active' : ''} ${theme}`}
            onClick={onSelectFiles}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className="drop-content">
                <div className="drop-icon-large">
                    <img
                        className="drop-logo"
                        src={theme === 'dark' ? logoWhite : logoDark}
                        alt="Logo"
                    />
                </div>
                <div className="drop-text-large">Добавить файл / файлы</div>
            </div>
            <div className="drop-info-large">
                Вы можете выбрать один или несколько файлов для конвертации, просто перенесите их в эту область
            </div>
        </div>
    )
}

export default SourcePage
