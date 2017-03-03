"use strict";

var mysql = require("mysql");
var config = require('./config');

var pool = mysql.createPool({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName
});

function getCurso(id, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT * FROM `cursos` WHERE `cursos`.`id` = ?", [id],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    if (typeof result[0] === "undefined") {
                        callback(null);
                    } else {
                        if (result[0].imagen === null || isEmpty(result[0].imagen))
                            var imagen = "";
                        else {
                            var imagen = result[0].imagen.replace(/\\/g, '\\');
                        }
                        callback(null, {
                            titulo: result[0].titulo,
                            descripcion: result[0].descripcion,
                            localidad: result[0].localidad,
                            direccion: result[0].direccion,
                            plazas: result[0].plazas,
                            fecha_inicio: result[0].fecha_inicio,
                            fecha_finalizacion: result[0].fecha_finalizacion,
                            imagen: imagen
                        });
                    }
                });
        }
    });
};

function altaCurso(curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("INSERT INTO `cursos` " +
                "(`titulo`, `descripcion`, `localidad`, `direccion`, `plazas`, `fecha_inicio`, `fecha_finalizacion`) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?);", [curso.titulo,
                    curso.descripcion,
                    curso.localidad,
                    curso.direccion,
                    curso.plazas,
                    curso.fecha_inicio,
                    curso.fecha_finalizacion
                ],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null, result.insertId);
                });
        }
    });
};


function updateCurso(id, curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("UPDATE `cursos` " +
                "SET `titulo` = ?, " +
                "`descripcion` = ?, " +
                "`localidad` = ?, " +
                "`direccion` = ?, " +
                "`plazas` = ?, " +
                "`fecha_inicio` = ?, " +
                "`fecha_finalizacion` = ? " +
                " WHERE `cursos`.`id` = ?", [curso.titulo,
                    curso.descripcion,
                    curso.localidad,
                    curso.direccion,
                    curso.plazas,
                    curso.fecha_inicio,
                    curso.fecha_finalizacion,
                    id
                ],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null, result.affectedRows);
                });
        }
    });
};


function bajaCurso(id, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("DELETE FROM `cursos` WHERE `cursos`.`id` = ?", [id],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null);
                });
        }
    });
};

function buscarPorNombre(string, num, pos, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT `id`,`titulo`,`localidad`,`fecha_inicio`,`fecha_finalizacion`,`plazas`" +
                "FROM `cursos` " +
                "WHERE `titulo` LIKE ? " +
                "ORDER BY `fecha_inicio` " +
                "LIMIT ? OFFSET ?", [string, num, pos],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    if (typeof result === "undefined") {
                        callback(null);
                    } else {
                        meterVacantesACursos(result.length, result, function(err, cursos) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, cursos);
                            }
                        });
                    }
                });
        }
    });
};

function resultadosPorNombre(string, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT count(*) AS resultados " +
                "FROM `cursos` " +
                "WHERE `titulo` LIKE ?", [string],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    if (typeof result === "undefined") {
                        callback(null);
                    } else {
                        callback(null, result[0].resultados);
                    }
                });
        }
    });
}

function subirImagen(callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("", [],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                });
        }
    });
}

function existeCurso(id, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT `id` FROM cursos WHERE `id`=?", [id],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null, result[0]);
                });
        }
    });
}

function quedanPlazas(id, callback) {
    getCurso(id, function(err, curso) {
        if (err) {
            callback(err);
        } else if (typeof curso === "undefined") {
            callback(null, false);
        } else {
            var dao = require("./dao_inscripciones");
            dao.getNumeroInscritos(id, function(err, inscritos) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, curso.plazas - inscritos > 0);
                }
            });
        }
    });
}

// usado en buscarPorNombre
function meterVacantesACursos(cursos_restantes, cursos, callback) {
    if (cursos_restantes === 0)
        callback(null, cursos);
    else {
        var dao = require("./dao_inscripciones");
        dao.getNumeroInscritos(cursos[cursos_restantes - 1].id, function(err, inscritos) {
            if (err) {
                callback(err);
            } else {
                cursos[cursos_restantes - 1].vacantes = cursos[cursos_restantes - 1].plazas - inscritos;
                cursos_restantes--;
                meterVacantesACursos(cursos_restantes, cursos, callback);
            }
        });
    }
}

function insertarImagen(id_curso, ruta, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("UPDATE `cursos` SET `imagen` = ? WHERE `cursos`.`id` = ?;", [ruta, id_curso],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null, ruta);
                });
        }
    });
}

function getImagen(id_curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT `imagen` FROM `cursos` WHERE `cursos`.`id` = ?", [id_curso],
                function(err, result) {
                    conexion.release();
                    if (err) {
                        callback(err);
                    } else if (result.length === 0) {
                        callback(null, undefined);
                    } else if (typeof result === "undefined") {
                        callback(null, undefined);
                    } else {
                        callback(null, result[0].imagen);
                    }
                });
        }
    });
}

function insertarHorario(id_curso, dia_semana, hora_inicio, hora_finalizacion, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("INSERT INTO `horarios` (`id`, `curso`, `dia_semana`, `hora_inicio`, `hora_finalizacion`) " + "VALUES (NULL, ?, ?, ?, ?)", [id_curso, dia_semana, hora_inicio, hora_finalizacion],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null);
                });
        }
    });
}

function borrarHorario(id_curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("DELETE FROM `horarios` WHERE `horarios`.`curso` = ?", [id_curso],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    callback(null);
                });
        }
    });
}

function getHorario(id_curso, callback) {
    if (callback === undefined) callback = function() {};
    pool.getConnection(function(err, conexion) {
        if (err) {
            callback(err);
        } else {
            conexion.query("SELECT * FROM `horarios` WHERE `curso` = ?", [id_curso],
                function(err, result) {
                    if (err) {
                        callback(err);
                    }
                    conexion.release();
                    if (typeof result === "undefined") {
                        callback(null, []);
                    } else
                        callback(null, result);
                });
        }
    });
}


module.exports = {
    quedanPlazas: quedanPlazas,
    existeCurso: existeCurso,
    subirImagen: subirImagen,
    resultadosPorNombre: resultadosPorNombre,
    buscarPorNombre: buscarPorNombre,
    bajaCurso: bajaCurso,
    updateCurso: updateCurso,
    altaCurso: altaCurso,
    getCurso: getCurso,
    insertarImagen: insertarImagen,
    insertarHorario: insertarHorario,
    borrarHorario: borrarHorario,
    getHorario: getHorario,
    getImagen: getImagen
};

function isEmpty(elem) {
    return elem.length === 0 || !elem.trim();
}
