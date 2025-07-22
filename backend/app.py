# -*- coding: utf-8 -*-
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from config import Config
from models import db, Vehiculo, Sensor, Medicion, PruebaAmortiguacion, ResultadoFormula
from datetime import datetime
import sys
import io

# Configurar encoding UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['JSON_AS_ASCII'] = False  # Permitir caracteres Unicode
    
    db.init_app(app)
    CORS(app)

    # --- VEHÍCULOS ---
    @app.route('/vehiculos', methods=['GET'])
    def listar_vehiculos():
        vehiculos = Vehiculo.query.all()
        return jsonify([{
            'id': v.id,
            'marca': v.marca,
            'modelo': v.modelo,
            'año': v.año,
            'masa_kg': v.masa_kg,
            'rigidez_resorte_N_m': v.rigidez_resorte_N_m,
            'placa': v.placa
        } for v in vehiculos])

    @app.route('/vehiculos', methods=['POST'])
    def crear_vehiculo():
        data = request.get_json()
        try:
            nuevo_vehiculo = Vehiculo(
                marca=data['marca'],
                modelo=data['modelo'],
                año=data['año'],
                masa_kg=data['masa_kg'],
                rigidez_resorte_N_m=data['rigidez_resorte_N_m'],
                placa=data.get('placa', '')
            )
            db.session.add(nuevo_vehiculo)
            db.session.commit()
            return jsonify({'id': nuevo_vehiculo.id}), 201
        except KeyError as e:
            abort(400, f"Campo faltante: {str(e)}")
        except Exception as e:
            db.session.rollback()
            abort(500, f"Error al crear vehículo: {str(e)}")

    # --- SENSORES ---
    @app.route('/sensores', methods=['GET'])
    def listar_sensores():
        sensores = Sensor.query.all()
        return jsonify([{
            'id': s.id,
            'tipo': s.tipo,
            'ubicacion': s.ubicacion,
            'vehiculo_id': s.vehiculo_id
        } for s in sensores])

    @app.route('/sensores', methods=['POST'])
    def crear_sensor():
        data = request.get_json()
        try:
            nuevo_sensor = Sensor(
                tipo=data['tipo'],
                ubicacion=data['ubicacion'],
                vehiculo_id=data['vehiculo_id']
            )
            db.session.add(nuevo_sensor)
            db.session.commit()
            return jsonify({'id': nuevo_sensor.id}), 201
        except KeyError as e:
            abort(400, f"Campo faltante: {str(e)}")
        except Exception as e:
            db.session.rollback()
            abort(500, f"Error al crear sensor: {str(e)}")

    # --- MEDICIONES ---
    @app.route('/mediciones', methods=['GET'])
    def listar_mediciones():
        mediciones = Medicion.query.order_by(Medicion.timestamp.desc()).all()
        return jsonify([{
            'id': m.id,
            'sensor_id': m.sensor_id,
            'amplitud_vibracion_chasis': m.amplitud_vibracion_chasis,
            'amplitud_vibracion_rueda': m.amplitud_vibracion_rueda,
            'frecuencia_Hz': m.frecuencia_Hz,
            'aceleracion_m_s2': m.aceleracion_m_s2,
            'temperatura_C': m.temperatura_C,
            'timestamp': m.timestamp.isoformat() if m.timestamp else None
        } for m in mediciones])

    @app.route('/mediciones', methods=['POST'])
    def crear_medicion():
        data = request.get_json()
        try:
            nueva_medicion = Medicion(
                sensor_id=data['sensor_id'],
                amplitud_vibracion_chasis=data.get('amplitud_vibracion_chasis'),
                amplitud_vibracion_rueda=data.get('amplitud_vibracion_rueda'),
                frecuencia_Hz=data.get('frecuencia_Hz'),
                aceleracion_m_s2=data.get('aceleracion_m_s2'),
                temperatura_C=data.get('temperatura_C')
            )
            db.session.add(nueva_medicion)
            db.session.commit()
            return jsonify({'id': nueva_medicion.id}), 201
        except KeyError as e:
            abort(400, f"Campo faltante: {str(e)}")
        except Exception as e:
            db.session.rollback()
            abort(500, f"Error al crear medición: {str(e)}")

    # --- PRUEBAS AMORTIGUACIÓN ---
    @app.route('/pruebas', methods=['GET'])
    def listar_pruebas():
        pruebas = PruebaAmortiguacion.query.all()
        return jsonify([{
            'id': p.id,
            'vehiculo_id': p.vehiculo_id,
            'coeficiente_amortiguamiento': p.coeficiente_amortiguamiento,
            'transmisibilidad': p.transmisibilidad,
            'frecuencia_natural_Hz': p.frecuencia_natural_Hz,
            'eficiencia_porcentaje': p.eficiencia_porcentaje,
            'fecha_prueba': p.fecha_prueba.isoformat() if p.fecha_prueba else None
        } for p in pruebas])

    @app.route('/pruebas', methods=['POST'])
    def crear_prueba():
        data = request.get_json()
        try:
            nueva_prueba = PruebaAmortiguacion(
                vehiculo_id=data['vehiculo_id'],
                coeficiente_amortiguamiento=data.get('coeficiente_amortiguamiento'),
                transmisibilidad=data.get('transmisibilidad'),
                frecuencia_natural_Hz=data.get('frecuencia_natural_Hz'),
                eficiencia_porcentaje=data.get('eficiencia_porcentaje')
            )
            db.session.add(nueva_prueba)
            db.session.commit()
            return jsonify({'id': nueva_prueba.id}), 201
        except KeyError as e:
            abort(400, f"Campo faltante: {str(e)}")
        except Exception as e:
            db.session.rollback()
            abort(500, f"Error al crear prueba: {str(e)}")

    # --- RESULTADOS FÓRMULAS ---
    @app.route('/resultados', methods=['GET'])
    def listar_resultados():
        resultados = ResultadoFormula.query.all()
        return jsonify([{
            'id': r.id,
            'prueba_id': r.prueba_id,
            'energia_antes_J': r.energia_antes_J,
            'energia_despues_J': r.energia_despues_J,
            'frecuencia_teorica_Hz': r.frecuencia_teorica_Hz,
            'frecuencia_medida_Hz': r.frecuencia_medida_Hz,
            'desviacion_frecuencia_porcentaje': r.desviacion_frecuencia_porcentaje
        } for r in resultados])

    @app.route('/resultados', methods=['POST'])
    def crear_resultado():
        data = request.get_json()
        try:
            nuevo_resultado = ResultadoFormula(
                prueba_id=data['prueba_id'],
                energia_antes_J=data['energia_antes_J'],
                energia_despues_J=data['energia_despues_J'],
                frecuencia_teorica_Hz=data['frecuencia_teorica_Hz'],
                frecuencia_medida_Hz=data['frecuencia_medida_Hz'],
                desviacion_frecuencia_porcentaje=data['desviacion_frecuencia_porcentaje']
            )
            db.session.add(nuevo_resultado)
            db.session.commit()
            return jsonify({'id': nuevo_resultado.id}), 201
        except KeyError as e:
            abort(400, f"Campo faltante: {str(e)}")
        except Exception as e:
            db.session.rollback()
            abort(500, f"Error al crear resultado: {str(e)}")

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)