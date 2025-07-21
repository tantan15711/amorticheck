import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DiagnosticWidget from './components/DiagnosticWidget.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import './App.css';

// Tipos de amortiguadores con sus características específicas
const TIPOS_AMORTIGUADORES = [
  { 
    id: 'hidraulico', 
    nombre: 'Amortiguador Hidráulico',
    descripcion: 'Utiliza aceite para absorber energía a través de válvulas internas',
    pruebas: [
      'Prueba de Fuerza vs. Velocidad (SAE J2788)',
      'Prueba de Cavitación (ASTM D4172)',
      'Prueba de Fugas de Aceite'
    ],
    sensores: [
      { id: 'vibracion', min: 0, max: 100, unidad: 'Hz', color: '#1E88E5', icono: '📳', nombre: 'Vibración' },
      { id: 'presion', min: 0, max: 100, unidad: 'kPa', color: '#1565C0', icono: '💨', nombre: 'Presión' },
      { id: 'temperatura', min: 0, max: 150, unidad: '°C', color: '#0D47A1', icono: '🌡️', nombre: 'Temperatura' },
      { id: 'fuerza', min: 0, max: 1000, unidad: 'N', color: '#1976D2', icono: '⚡', nombre: 'Fuerza' },
    ]
  },
  { 
    id: 'gas_monotubo', 
    nombre: 'Amortiguador de Gas (Monotubo)',
    descripcion: 'Usa aceite y gas nitrógeno a alta presión para mejor respuesta',
    pruebas: [
      'Medición de Presión de Gas (20-30 bar)',
      'Prueba de Respuesta Rápida (ISO 18137)',
      'Prueba de Durabilidad (500,000 ciclos)'
    ],
    sensores: [
      { id: 'vibracion', min: 0, max: 100, unidad: 'Hz', color: '#1E88E5', icono: '📳', nombre: 'Vibración' },
      { id: 'presion', min: 0, max: 100, unidad: 'kPa', color: '#1565C0', icono: '💨', nombre: 'Presión' },
      { id: 'temperatura', min: 0, max: 150, unidad: '°C', color: '#0D47A1', icono: '🌡️', nombre: 'Temperatura' },
      { id: 'fuerza', min: 0, max: 1000, unidad: 'N', color: '#1976D2', icono: '⚡', nombre: 'Fuerza' },
      { id: 'presion_gas', min: 0, max: 40, unidad: 'bar', color: '#FF5722', icono: '⛽', nombre: 'Presión Gas' },
    ]
  },
  { 
    id: 'gas_dobletubo', 
    nombre: 'Amortiguador de Gas (Doble Tubo)',
    descripcion: 'Combina aceite con gas nitrógeno a baja presión',
    pruebas: [
      'Prueba de Estanqueidad en Agua',
      'Prueba de Impacto (Salt Test)',
      'Prueba de Fuerza Dinámica'
    ],
    sensores: [
      { id: 'vibracion', min: 0, max: 100, unidad: 'Hz', color: '#1E88E5', icono: '📳', nombre: 'Vibración' },
      { id: 'presion', min: 0, max: 100, unidad: 'kPa', color: '#1565C0', icono: '💨', nombre: 'Presión' },
      { id: 'temperatura', min: 0, max: 150, unidad: '°C', color: '#0D47A1', icono: '🌡️', nombre: 'Temperatura' },
      { id: 'fuerza', min: 0, max: 1000, unidad: 'N', color: '#1976D2', icono: '⚡', nombre: 'Fuerza' },
    ]
  },
  { 
    id: 'regulable', 
    nombre: 'Amortiguador Regulable',
    descripcion: 'Permite ajustar la dureza (modos Sport/Comfort)',
    pruebas: [
      'Prueba de Resistencia Eléctrica (2-10 Ω)',
      'Prueba de Respuesta a Señales PWM',
      'Prueba de Compatibilidad CAN Bus'
    ],
    sensores: [
      { id: 'vibracion', min: 0, max: 100, unidad: 'Hz', color: '#1E88E5', icono: '📳', nombre: 'Vibración' },
      { id: 'presion', min: 0, max: 100, unidad: 'kPa', color: '#1565C0', icono: '💨', nombre: 'Presión' },
      { id: 'temperatura', min: 0, max: 150, unidad: '°C', color: '#0D47A1', icono: '🌡️', nombre: 'Temperatura' },
      { id: 'fuerza', min: 0, max: 1000, unidad: 'N', color: '#1976D2', icono: '⚡', nombre: 'Fuerza' },
      { id: 'resistencia', min: 0, max: 20, unidad: 'Ω', color: '#9C27B0', icono: '🔌', nombre: 'Resistencia' },
    ]
  }
];

// Fabricantes con sus estándares específicos
const FABRICANTES = [
  { id: 'bilstein', nombre: 'Bilstein', norma: 'B46-0001', presionGas: '25-30 bar', ciclosFatiga: '500,000' },
  { id: 'kyb', nombre: 'KYB', norma: 'KES 07.202', presionGas: 'N/A', ciclosFatiga: '200,000' },
  { id: 'monroe', nombre: 'Monroe', norma: 'M-CARE 3.0', presionGas: 'N/A', ciclosFatiga: '200,000' },
  { id: 'ohlins', nombre: 'Öhlins', norma: 'TTX Series', presionGas: '20-25 bar', ciclosFatiga: '1,000,000+' },
  { id: 'sachs', nombre: 'Sachs', norma: 'SRE 4.2', presionGas: 'N/A', ciclosFatiga: '300,000' },
];

function App() {
  const [tipoAmortiguador, setTipoAmortiguador] = useState('gas_monotubo');
  const [fabricante, setFabricante] = useState('bilstein');
  const [datosSensores, setDatosSensores] = useState({});
  const [diagnostico, setDiagnostico] = useState({
    estado: 'Desconocido',
    descripcion: 'Selecciona el tipo de amortiguador y fabricante para comenzar',
    color: '#9E9E9E',
    icono: '❓',
  });
  const [estadoConexion, setEstadoConexion] = useState({
    conectado: true,
    mensaje: 'Sistema listo',
    serialConectado: false,
  });
  const [error,] = useState(null);
  const [errorSerial, setErrorSerial] = useState(null);
  const [lecturaActiva, setLecturaActiva] = useState(false);
  const [mostrarSensores, setMostrarSensores] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [porcentajeProgreso, setPorcentajeProgreso] = useState(0);
  const [datosFinales, setDatosFinales] = useState(null);
  const [pruebasRealizadas, setPruebasRealizadas] = useState([]);
  const [contadorDiagnosticos, setContadorDiagnosticos] = useState(0);
  const [puertosDisponibles, setPuertosDisponibles] = useState([]);
  const [puertoSeleccionado, setPuertoSeleccionado] = useState(null);
  
  const lecturaActivaRef = useRef(lecturaActiva);
  const intervaloRef = useRef(null);
  const progresoRef = useRef(null);
  const timeoutFinalRef = useRef(null);
  const timeoutInicioSimRef = useRef(null);
  const valoresBaseRef = useRef(null);
  const pruebasIntervalRef = useRef(null);
  const puertoSerialRef = useRef(null);
  const lectorRef = useRef(null);

  // Inicializar datos de sensores según el tipo seleccionado
  useEffect(() => {
    const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
    const datosIniciales = {};
    
    tipo.sensores.forEach(sensor => {
      datosIniciales[sensor.id] = {
        actual: 0,
        historial: [],
        min: 0,
        max: 0,
        promedio: 0
      };
    });
    
    setDatosSensores(datosIniciales);
  }, [tipoAmortiguador]);

  // Mantener la ref actualizada
  useEffect(() => {
    lecturaActivaRef.current = lecturaActiva;
  }, [lecturaActiva]);

  // Limpiar intervalos y timeouts al desmontar
  useEffect(() => {
    return () => {
      clearRefs();
      desconectarSerial();
    };
  }, []);

  // Función para limpiar todas las referencias
  const clearRefs = () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    if (progresoRef.current) clearInterval(progresoRef.current);
    if (timeoutFinalRef.current) clearTimeout(timeoutFinalRef.current);
    if (timeoutInicioSimRef.current) clearTimeout(timeoutInicioSimRef.current);
    if (pruebasIntervalRef.current) clearInterval(pruebasIntervalRef.current);
    
    intervaloRef.current = null;
    progresoRef.current = null;
    timeoutFinalRef.current = null;
    timeoutInicioSimRef.current = null;
    pruebasIntervalRef.current = null;
  };

  // Detectar puertos seriales disponibles
  const detectarPuertosSeriales = async () => {
    try {
      // Verificar si el navegador soporta Web Serial API
      if (!('serial' in navigator)) {
        setErrorSerial('API Serial no soportada en este navegador');
        return;
      }

      // Solicitar puertos disponibles
      const puertos = await navigator.serial.getPorts();
      setPuertosDisponibles(puertos);
      
      if (puertos.length === 0) {
        setErrorSerial('No se detectaron puertos seriales disponibles');
      } else {
        setErrorSerial(null);
      }
    } catch (err) {
      setErrorSerial(`Error al detectar puertos: ${err.message}`);
    }
  };

  // Conectar a un puerto serial
  const conectarSerial = async () => {
    try {
      if (!puertoSeleccionado) {
        setErrorSerial('Selecciona un puerto primero');
        return;
      }
      
      // Abrir el puerto serial
      await puertoSeleccionado.open({ baudRate: 9600 });
      puertoSerialRef.current = puertoSeleccionado;
      
      // Configurar lector
      const lector = puertoSeleccionado.readable.getReader();
      lectorRef.current = lector;
      
      setEstadoConexion({
        conectado: true,
        mensaje: 'Conectado a dispositivo serial',
        serialConectado: true,
      });
      
      setErrorSerial(null);
      
      // Leer datos del puerto serial continuamente
      leerDatosSeriales();
      
    } catch (err) {
      setErrorSerial(`Error al conectar: ${err.message}`);
    }
  };

  // Desconectar puerto serial
  const desconectarSerial = async () => {
    try {
      if (lectorRef.current) {
        await lectorRef.current.cancel();
        lectorRef.current = null;
      }
      
      if (puertoSerialRef.current) {
        await puertoSerialRef.current.close();
        puertoSerialRef.current = null;
      }
      
      setEstadoConexion({
        conectado: true,
        mensaje: 'Sistema listo',
        serialConectado: false,
      });
      
      setPuertoSeleccionado(null);
      setErrorSerial(null);
      
    } catch (err) {
      setErrorSerial(`Error al desconectar: ${err.message}`);
    }
  };

  // Leer datos del puerto serial
  const leerDatosSeriales = async () => {
    if (!lectorRef.current) return;
    
    try {
      while (lecturaActivaRef.current && lectorRef.current) {
        const { value, done } = await lectorRef.current.read();
        
        if (done) {
          // Lectura completada
          lectorRef.current.releaseLock();
          break;
        }
        
        if (value) {
          // Convertir Uint8Array a string
          const texto = new TextDecoder().decode(value);
          procesarDatosSeriales(texto);
        }
      }
    } catch (err) {
      setErrorSerial(`Error de lectura: ${err.message}`);
    }
  };

  // Procesar datos recibidos del puerto serial
  const procesarDatosSeriales = (texto) => {
    try {
      // Suponiendo que los datos vienen en formato JSON
      const datos = JSON.parse(texto);
      const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
      
      setDatosSensores(prev => {
        const nuevosDatos = { ...prev };
        
        tipo.sensores.forEach(sensor => {
          const clave = sensor.id;
          const valor = datos[clave] || 0;
          
          if (valor !== undefined) {
            const historial = [...(prev[clave]?.historial || []), valor].slice(-30);
            const min = Math.min(prev[clave]?.min || Infinity, valor);
            const max = Math.max(prev[clave]?.max || -Infinity, valor);
            const promedio = historial.reduce((a, b) => a + b, 0) / historial.length;
            
            nuevosDatos[clave] = {
              actual: +valor.toFixed(2),
              historial,
              min: +min.toFixed(2),
              max: +max.toFixed(2),
              promedio: +promedio.toFixed(2),
            };
          }
        });
        
        return nuevosDatos;
      });
    } catch (err) {
      console.error('Error procesando datos seriales:', err);
    }
  };

  // Iniciar/detener la lectura
  const toggleLectura = () => {
    const nuevoEstado = !lecturaActiva;
    setLecturaActiva(nuevoEstado);
    
    if (nuevoEstado) {
      // Limpiar cualquier proceso previo
      clearRefs();
      
      // Resetear datos a ceros
      const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
      const datosIniciales = {};
      
      tipo.sensores.forEach(sensor => {
        datosIniciales[sensor.id] = {
          actual: 0,
          historial: [],
          min: 0,
          max: 0,
          promedio: 0
        };
      });
      
      setDatosSensores(datosIniciales);
      setPruebasRealizadas([]);
      
      setProcesando(true);
      setPorcentajeProgreso(0);
      setDatosFinales(null);
      
      // Mensaje de evaluación inicial
      setDiagnostico({
        estado: 'Evaluando',
        descripcion: 'Iniciando pruebas específicas...',
        color: '#FF9800',
        icono: '⏳',
      });
      
      // Barra de progreso (30 segundos)
      const startTime = Date.now();
      progresoRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / 30000) * 100);
        // Mostrar como número entero
        setPorcentajeProgreso(Math.round(progress));
      }, 100);
      
      // Retraso aleatorio para inicio de simulación (10-15 segundos)
      const delay = 10000 + Math.random() * 5000;
      timeoutInicioSimRef.current = setTimeout(() => {
        setDiagnostico({
          estado: 'Evaluando',
          descripcion: 'Realizando pruebas técnicas...',
          color: '#FF9800',
          icono: '⏳',
        });
        
        // Si no hay conexión serial, iniciar simulación
        if (!estadoConexion.serialConectado) {
          iniciarSimulacion();
        }
      }, delay);

      // Programar el diagnóstico final después de 30 segundos
      timeoutFinalRef.current = setTimeout(() => {
        const estados = ['ÓPTIMO', 'CRÍTICO', 'ACEPTABLE'];
        const descripciones = [
          'El amortiguador funciona en condiciones óptimas según los estándares del fabricante.',
          'El amortiguador requiere intervención inmediata según los resultados de las pruebas.',
          'El amortiguador muestra signos de desgaste, se recomienda revisión.'
        ];
        const colores = ['#4CAF50', '#F44336', '#FF9800'];
        const iconos = ['✅', '❌', '⚠️'];
        
        // Obtener el estado actual basado en el contador (0,1,2) y luego rotar
        const estadoActual = contadorDiagnosticos % 3;
        
        // Guardar los datos finales antes de detener
        setDatosSensores(prev => {
          setDatosFinales({...prev});
          return prev;
        });
        
        setDiagnostico({
          estado: estados[estadoActual],
          descripcion: descripciones[estadoActual],
          color: colores[estadoActual],
          icono: iconos[estadoActual],
        });
        
        // Incrementar el contador para el próximo diagnóstico
        setContadorDiagnosticos(prev => prev + 1);
        
        setProcesando(false);
      }, 30000); // 30 segundos
    } else {
      // Detener completamente
      setProcesando(false);
      setPorcentajeProgreso(0);
      
      // Limpiar todos los intervalos y timeouts
      clearRefs();
      
      // Resetear datos a ceros
      const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
      const datosIniciales = {};
      
      tipo.sensores.forEach(sensor => {
        datosIniciales[sensor.id] = {
          actual: 0,
          historial: [],
          min: 0,
          max: 0,
          promedio: 0
        };
      });
      
      setDatosSensores(datosIniciales);
      
      // Volver al estado inicial
      setDiagnostico({
        estado: 'Desconocido',
        descripcion: 'Diagnóstico detenido. Listo para nueva evaluación.',
        color: '#9E9E9E',
        icono: '❓',
      });
    }
  };

  // Obtener valores base según tipo de amortiguador
  const obtenerValoresBase = () => {
    const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
    
    // Valores base según el estado del amortiguador
    const valoresBase = {
      0: { // ÓPTIMO
        vibracion: { min: 5, max: 15 },
        presion: { min: 30, max: 50 },
        temperatura: { min: 25, max: 40 },
        fuerza: { min: 700, max: 900 },
        presion_gas: { min: tipo.id === 'gas_monotubo' ? 25 : 0, max: tipo.id === 'gas_monotubo' ? 30 : 0 },
        resistencia: { min: 2, max: 10 }
      },
      1: { // CRÍTICO
        vibracion: { min: 40, max: 60 },
        presion: { min: 5, max: 20 },
        temperatura: { min: 60, max: 80 },
        fuerza: { min: 200, max: 400 },
        presion_gas: { min: tipo.id === 'gas_monotubo' ? 10 : 0, max: tipo.id === 'gas_monotubo' ? 15 : 0 },
        resistencia: { min: 0, max: 1 }
      },
      2: { // ACEPTABLE
        vibracion: { min: 20, max: 35 },
        presion: { min: 20, max: 40 },
        temperatura: { min: 40, max: 55 },
        fuerza: { min: 500, max: 700 },
        presion_gas: { min: tipo.id === 'gas_monotubo' ? 20 : 0, max: tipo.id === 'gas_monotubo' ? 25 : 0 },
        resistencia: { min: 1, max: 2 }
      }
    };
    
    return valoresBase;
  };

  // Iniciar simulación realista
  const iniciarSimulacion = () => {
    const valoresBase = obtenerValoresBase();
    const estado = Math.floor(Math.random() * 3); // Estado aleatorio para simulación
    
    valoresBaseRef.current = valoresBase[estado];
    
    const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
    
    // Crear datos iniciales
    const datosIniciales = {};
    tipo.sensores.forEach(sensor => {
      datosIniciales[sensor.id] = {
        actual: valoresBaseRef.current[sensor.id]?.min || 0,
        historial: [],
        min: valoresBaseRef.current[sensor.id]?.min || 0,
        max: valoresBaseRef.current[sensor.id]?.min || 0,
        promedio: valoresBaseRef.current[sensor.id]?.min || 0
      };
    });
    
    setDatosSensores(datosIniciales);
    
    // Iniciar pruebas específicas
    pruebasIntervalRef.current = setInterval(() => {
      const pruebaIndex = Math.floor(Math.random() * tipo.pruebas.length);
      if (!pruebasRealizadas.includes(tipo.pruebas[pruebaIndex])) {
        setPruebasRealizadas(prev => [...prev, tipo.pruebas[pruebaIndex]]);
      }
    }, 5000);
    
    // Iniciar intervalo para actualizar datos
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    
    intervaloRef.current = setInterval(() => {
      setDatosSensores(prev => {
        const nuevosDatos = { ...prev };
        
        tipo.sensores.forEach(sensor => {
          const clave = sensor.id;
          const base = valoresBaseRef.current[clave];
          
          if (!base) return;
          
          // Generar nuevo valor con variación realista
          const variacion = (Math.random() - 0.5) * (base.max - base.min) * 0.1;
          const nuevoValor = Math.max(
            base.min, 
            Math.min(
              base.max, 
              prev[clave].actual + variacion
            )
          );
          
          // Mantener valores dentro de límites realistas
          const historial = [...prev[clave].historial, nuevoValor].slice(-30);
          const min = Math.min(prev[clave].min, nuevoValor);
          const max = Math.max(prev[clave].max, nuevoValor);
          const promedio = historial.reduce((a, b) => a + b, 0) / historial.length;
          
          nuevosDatos[clave] = {
            actual: +nuevoValor.toFixed(2),
            historial,
            min: +min.toFixed(2),
            max: +max.toFixed(2),
            promedio: +promedio.toFixed(2),
          };
        });
        
        return nuevosDatos;
      });
    }, 500); // Actualizar cada 500ms para una apariencia realista
  };

  // Generar y descargar reporte PDF
  const generarReporte = () => {
    const tipo = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
    const fabricanteActual = FABRICANTES.find(f => f.id === fabricante);
    
    // Usar datos finales si están disponibles
    const datosParaReporte = datosFinales || datosSensores;
    
    // Crear nuevo documento PDF
    const doc = new jsPDF();
    
    // Logo y título
    try {
      doc.addImage(`${process.env.PUBLIC_URL}/amorticheck.png`, 'PNG', 80, 10, 50, 20);
    } catch (e) {
      console.log("Logo no cargado");
    }
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("Reporte Técnico de Diagnóstico", 105, 40, { align: 'center' });
    
    // Información del amortiguador
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Tipo de Amortiguador:", 20, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${tipo.nombre} - ${tipo.descripcion}`, 20, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.text("Fabricante:", 20, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fabricanteActual.nombre} (Norma: ${fabricanteActual.norma})`, 20, 79);
    
    // Estado y fecha
    doc.setFont('helvetica', 'bold');
    doc.text("Estado del Diagnóstico:", 20, 89);
    doc.setFont('helvetica', 'normal');
    doc.text(`${diagnostico.estado} - ${diagnostico.descripcion}`, 20, 96);
    
    doc.setFont('helvetica', 'bold');
    doc.text("Fecha:", 20, 106);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date().toLocaleDateString()}`, 20, 113);
    
    // Pruebas realizadas
    doc.setFont('helvetica', 'bold');
    doc.text("Pruebas Realizadas:", 20, 123);
    doc.setFont('helvetica', 'normal');
    const pruebasY = 130;
    tipo.pruebas.forEach((prueba, index) => {
      const yPos = pruebasY + (index * 7);
      doc.text(`• ${prueba}`, 20, yPos);
    });
    
    // Datos de sensores
    const startY = pruebasY + (tipo.pruebas.length * 7) + 10;
    doc.setFont('helvetica', 'bold');
    doc.text("Datos Técnicos de Sensores:", 20, startY);
    
    // Tabla de sensores
    const headers = [['Sensor', 'Valor', 'Mínimo', 'Máximo', 'Promedio']];
    const data = tipo.sensores.map(sensor => {
      const dato = datosParaReporte[sensor.id];
      return [
        sensor.nombre, 
        `${Math.round(dato.actual)} ${sensor.unidad}`, 
        `${Math.round(dato.min)} ${sensor.unidad}`, 
        `${Math.round(dato.max)} ${sensor.unidad}`, 
        `${Math.round(dato.promedio)} ${sensor.unidad}`
      ];
    });
    
    autoTable(doc, {
      startY: startY + 5,
      head: headers,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: '#2c3e50' }
    });
    
    // Estándares del fabricante
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
    doc.setFont('helvetica', 'bold');
    doc.text("Estándares del Fabricante:", 20, finalY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const recomendaciones = [
      `• Norma aplicada: ${fabricanteActual.norma}`,
      `• Presión de gas: ${fabricanteActual.presionGas}`,
      `• Ciclos de fatiga: ${fabricanteActual.ciclosFatiga}`
    ];
    const splitRecomendaciones = doc.splitTextToSize(recomendaciones.join('\n'), 170);
    doc.text(splitRecomendaciones, 20, finalY + 10);
    
    // Pie de página
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Sistema AmortiCheck Pro © " + new Date().getFullYear(), 105, 280, { align: 'center' });
    
    // Descargar el PDF
    const fechaReporte = new Date().toISOString().slice(0, 10);
    doc.save(`reporte-${tipo.id}-${fechaReporte}.pdf`);
  };

  const tipoActual = TIPOS_AMORTIGUADORES.find(t => t.id === tipoAmortiguador);
  const fabricanteActual = FABRICANTES.find(f => f.id === fabricante);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <img src={`${process.env.PUBLIC_URL}/amorticheck.png`} alt="Logo AmortiCheck" className="app-logo" />
        </div>
        <div className="app-title">
          <div className="title-container">
            <h1>AMORTICHECK PRO</h1>
            <p className="app-subtitle">Sistema Avanzado de Diagnóstico de Amortiguadores</p>
          </div>
        </div>
      </header>
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      
      {errorSerial && (
        <div className="error-message">
          ⚠️ {errorSerial}
        </div>
      )}
      
      <div className="configuration-panel">
        <h3>Configuración del Diagnóstico</h3>
        
        <div className="config-row">
          <div className="config-group">
            <label>Tipo de Amortiguador:</label>
            <select 
              value={tipoAmortiguador} 
              onChange={(e) => setTipoAmortiguador(e.target.value)}
              disabled={lecturaActiva}
            >
              {TIPOS_AMORTIGUADORES.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="config-group">
            <label>Fabricante:</label>
            <select 
              value={fabricante} 
              onChange={(e) => setFabricante(e.target.value)}
              disabled={lecturaActiva}
            >
              {FABRICANTES.map(fab => (
                <option key={fab.id} value={fab.id}>{fab.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="config-description">
          <strong>{tipoActual.nombre}:</strong> {tipoActual.descripcion}
        </div>
        
        <div className="config-standards">
          <h4>Estándares del Fabricante:</h4>
          <ul>
            <li><strong>Norma:</strong> {fabricanteActual.norma}</li>
            <li><strong>Presión de gas:</strong> {fabricanteActual.presionGas}</li>
            <li><strong>Ciclos de fatiga:</strong> {fabricanteActual.ciclosFatiga}</li>
          </ul>
        </div>
        
        <div className="serial-controls">
          <h4>Conexión Serial:</h4>
          <div className="serial-buttons">
            <button 
              onClick={detectarPuertosSeriales} 
              className="btn serial-btn"
            >
              🔍 Detectar Puertos
            </button>
            
            {puertosDisponibles.length > 0 && (
              <div className="serial-ports">
                <label>Puertos detectados:</label>
                <select
                  value={puertoSeleccionado ? puertoSeleccionado.getInfo().usbVendorId : ''}
                  onChange={(e) => {
                    const port = puertosDisponibles.find(
                      p => p.getInfo().usbVendorId === parseInt(e.target.value)
                    );
                    setPuertoSeleccionado(port);
                  }}
                >
                  <option value="">Selecciona un puerto</option>
                  {puertosDisponibles.map((port, index) => {
                    const info = port.getInfo();
                    return (
                      <option 
                        key={index} 
                        value={info.usbVendorId}
                      >
                        {info.usbProductId ? `Puerto ${info.usbProductId}` : `Puerto ${index + 1}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            
            <button 
              onClick={estadoConexion.serialConectado ? desconectarSerial : conectarSerial} 
              className={`btn ${estadoConexion.serialConectado ? 'serial-disconnect' : 'serial-connect'}`}
              disabled={!puertoSeleccionado && !estadoConexion.serialConectado}
            >
              {estadoConexion.serialConectado ? '❌ Desconectar Serial' : '🔌 Conectar Serial'}
            </button>
          </div>
        </div>
      </div>
      
      <ControlPanel 
        estadoConexion={estadoConexion}
        lecturaActiva={lecturaActiva}
        toggleLectura={toggleLectura}
      />
      
      <div className="sensors-toggle">
        <button 
          onClick={() => setMostrarSensores(!mostrarSensores)}
          className="btn view-sensors"
        >
          {mostrarSensores ? 'OCULTAR SENSORES' : 'VER DATOS TÉCNICOS'}
        </button>
      </div>
      
      {mostrarSensores && (
        <div className="sensors-section">
          <div className="sensors-table-container">
            <table className="sensors-table">
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Valor</th>
                  <th>Mínimo</th>
                  <th>Máximo</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {tipoActual.sensores.map(sensor => {
                  const dato = datosSensores[sensor.id];
                  
                  return (
                    <tr key={sensor.id}>
                      <td>
                        <span className="sensor-icon" style={{ color: sensor.color }}>
                          {sensor.icono}
                        </span>
                        {sensor.nombre}
                      </td>
                      <td>{Math.round(dato?.actual || 0)} {sensor.unidad}</td>
                      <td>{Math.round(dato?.min || 0)} {sensor.unidad}</td>
                      <td>{Math.round(dato?.max || 0)} {sensor.unidad}</td>
                      <td>{Math.round(dato?.promedio || 0)} {sensor.unidad}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="tests-container">
            <h4>Pruebas Específicas Realizadas:</h4>
            <ul>
              {pruebasRealizadas.map((prueba, index) => (
                <li key={index}>{prueba}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="diagnostic-section">
        <h2>DIAGNÓSTICO TÉCNICO</h2>
        <DiagnosticWidget 
          diagnostico={diagnostico} 
          generarReporte={generarReporte} 
          procesando={procesando}
          porcentajeProgreso={porcentajeProgreso}
          lecturaActiva={lecturaActiva}
        />
      </div>
      
      <footer className="app-footer">
        <p>Sistema AmortiCheck Pro &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;