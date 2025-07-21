import React from 'react';

const ControlPanel = ({
  estadoConexion,
  lecturaActiva,
  toggleLectura
}) => {
  return (
    <div className="control-panel">
      <h2>CONTROL DE DIAGNÓSTICO</h2>
      <div className="connection-status">
        <span className={`status-indicator ${estadoConexion.conectado ? 'connected' : 'disconnected'}`}></span>
        {estadoConexion.mensaje}
        {estadoConexion.conectado && (
          <span className="data-status">
            {lecturaActiva ? '● Diagnóstico en curso' : 'Sistema en espera'}
          </span>
        )}
        {estadoConexion.serialConectado && (
          <span className="data-status"> ● Serial Conectado</span>
        )}
      </div>
      
      <div className="controls">
        <button 
          onClick={toggleLectura} 
          className={`btn ${lecturaActiva ? 'stop' : 'start'}`}
        >
          {lecturaActiva ? '⏹ FINALIZAR DIAGNÓSTICO' : '▶ INICIAR DIAGNÓSTICO'}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;