# -*- coding: utf-8 -*-
from datetime import datetime
from . import db

class Vehiculo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    marca = db.Column(db.String(80), nullable=False)
    modelo = db.Column(db.String(80), nullable=False)
    año = db.Column(db.Integer, nullable=False)
    masa_kg = db.Column(db.Float, nullable=False)
    rigidez_resorte_N_m = db.Column(db.Float, nullable=False)
    placa = db.Column(db.String(20))
    
    sensores = db.relationship('Sensor', backref='vehiculo', lazy=True)
    pruebas = db.relationship('PruebaAmortiguacion', backref='vehiculo', lazy=True)

class Sensor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(50), nullable=False)
    ubicacion = db.Column(db.String(100), nullable=False)
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'), nullable=False)
    
    mediciones = db.relationship('Medicion', backref='sensor', lazy=True)

class Medicion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.Integer, db.ForeignKey('sensor.id'), nullable=False)
    amplitud_vibracion_chasis = db.Column(db.Float)
    amplitud_vibracion_rueda = db.Column(db.Float)
    frecuencia_Hz = db.Column(db.Float)
    aceleracion_m_s2 = db.Column(db.Float)
    temperatura_C = db.Column(db.Float)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class PruebaAmortiguacion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'), nullable=False)
    coeficiente_amortiguamiento = db.Column(db.Float)
    transmisibilidad = db.Column(db.Float)
    frecuencia_natural_Hz = db.Column(db.Float)
    eficiencia_porcentaje = db.Column(db.Float)
    fecha_prueba = db.Column(db.DateTime, default=datetime.utcnow)
    
    resultados = db.relationship('ResultadoFormula', backref='prueba', lazy=True)

class ResultadoFormula(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prueba_id = db.Column(db.Integer, db.ForeignKey('prueba_amortiguacion.id'), nullable=False)
    energia_antes_J = db.Column(db.Float)
    energia_despues_J = db.Column(db.Float)
    frecuencia_teorica_Hz = db.Column(db.Float)
    frecuencia_medida_Hz = db.Column(db.Float)
    desviacion_frecuencia_porcentaje = db.Column(db.Float)