import React from 'react';

const DiagnosticWidget = ({ diagnostico, generarReporte, procesando, porcentajeProgreso }) => {
  return (
    <div className="diagnostic-widget" style={{ backgroundColor: `${diagnostico.color}22`, borderColor: diagnostico.color }}>
      <div className="diagnostic-header">
        <span className="diagnostic-icon">{diagnostico.icono}</span>
        <h3>{diagnostico.estado}</h3>
      </div>
      
      <p className="diagnostic-description">{diagnostico.descripcion}</p>
      
      {procesando && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${porcentajeProgreso}%` }}>
            <span>{porcentajeProgreso}%</span>
          </div>
        </div>
      )}
      
      {!procesando && diagnostico.estado !== 'Desconocido' && diagnostico.estado !== 'Evaluando' && (
        <button onClick={generarReporte} className="btn download-btn">
          <span className="download-icon">⬇️</span> Descargar Reporte Completo
        </button>
      )}
    </div>
  );
};

export default DiagnosticWidget;