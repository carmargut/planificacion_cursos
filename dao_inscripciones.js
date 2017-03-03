"use strict";

var mysql = require("mysql");
var config = require('./config');

var pool = mysql.createPool({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName
});

function inscribir(id_curso, id_usuario, callback) {
    if (callback === undefined) callback = function() {};
    estaInscrito(id_curso, id_usuario, function(err, inscrito) {
        if (err) {
            callback(err);
        } else {
            if (inscrito) {
                callback(null, false); //  ya está inscrito
            } else {
                var dao_curso = require("./dao_curso");
                dao_curso.quedanPlazas(id_curso, function(err, quedanPlazas) { // comprobamos que quedan plazas
                    if (err) {
                        callback(err);
                    } else {
                        if (quedanPlazas) {
                            pool.getConnection(function(err, conexion) {
                                if (err) {
                                    callback(err);
                                } else {
                                    conexion.query("INSERT INTO `pertenece` (`id`, `usuario`, `curso`) VALUES (NULL, ?, ?)", [id_usuario, id_curso],
                                        function(err, result) {
                                            if (err) {
                                                callback(err);
                                            }
                                            conexion.release();
                                            if (result.affectedRows > 0)
                                                callback(null, true);
                                        });
                                }
                            });
                        } else {
                            callback(null, false); // no hay plazas
                        }
                    }
                });
            }
        }
    });
};

function estaInscrito(id_curso, id_usuario, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT `usuario` FROM `pertenece` WHERE `curso`= ?", [id_curso],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    var inscrito = false;
                    if (result[0] === undefined)
                        callback(null, false);
                    else {
                        result.forEach(function(elem) {
                            if (elem.usuario === id_usuario)
                                inscrito = true;
                        });
                        callback(null, inscrito);
                    }
                });
        }
    });
}

function getCursosInscrito(id_usuario, lunes, domingo, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT c.id, c.titulo, c.localidad, c.fecha_inicio, c.fecha_finalizacion " +
                " FROM cursos c, pertenece p " +
                " WHERE c.id = p.curso AND p.usuario = ?" +
                " GROUP BY c.titulo", [id_usuario],
                function(err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        conexion.release();
                        if (lunes === null && domingo === null) { // si no nos interesa despreciar los que no se cursen en x semana
                            callback(null, result);
                        } else { // si solo queremos los que se cursen en cierta semana
                            var quitar = new Array(); // donde voy a guardar los cursos a despreciar
                            result.forEach(function(curso) { // por cada uno miro si ya acabó o no ha empezado todavía
                                if (Date.parse(domingo) < Date.parse(curso.fecha_inicio) || Date.parse(lunes) > Date.parse(curso.fecha_finalizacion)) {
                                    quitar.push(curso); // anoto que quiero borrarlo
                                }
                            });
                            quitar.forEach(function (curso) { // los borro
                                result.splice(result.indexOf(curso), 1);
                            });
                            callback(null, result);
                        }
                    }
                });
        }
    });
}

function getCursosInscritosPorHora(id_usuario, hora_inicio, dia_semana, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT h.hora_inicio, h.dia_semana, c.titulo, h.hora_finalizacion, c.fecha_inicio, c.fecha_finalizacion" +
                " FROM `horarios` h, `cursos` c, `pertenece` p " +
                " WHERE c.id = p.curso AND p.usuario = ? AND p.curso = h.curso AND h.dia_semana = ? AND h.hora_inicio = ?", [id_usuario, dia_semana, hora_inicio],
                function(err, result) {
                    conexion.release();
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
        }
    });
}

function getNumeroInscritos(id_curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT count(*) AS numero FROM `pertenece` WHERE curso = ?", [id_curso],
                function(err, numero_inscritos) {
                    if (err) {
                        callback(err);
                    } else {
                        conexion.release();
                        callback(null, numero_inscritos[0].numero);
                    }

                });
        }
    });
}


module.exports = {
    inscribir: inscribir,
    getCursosInscrito: getCursosInscrito,
    getNumeroInscritos: getNumeroInscritos,
    getCursosInscritosPorHora: getCursosInscritosPorHora
};
