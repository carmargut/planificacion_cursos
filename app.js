"use strict";

var path = require("path");
var express = require("express");
var config = require('./config');
var bodyParser = require("body-parser");
var expressvalidator = require("express-validator");
var passport = require("passport");
var passportHTTP = require("passport-http");
var https = require("https");
var fs = require("fs");
var multer = require("multer");
var upload = multer({ dest: "uploads/" });
var app = express();

var clavePrivada = fs.readFileSync(config.private_key);
var certificado = fs.readFileSync(config.certificate);

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressvalidator({}));
app.use(passport.initialize());

var servidor = https.createServer({ key: clavePrivada, cert: certificado }, app);


passport.use(new passportHTTP.BasicStrategy({ realm: 'Autenticación requerida' },
    function(user, pass, callback) {
        var dao = require("./dao_usuario");
        dao.getUserByEmail(user, function(err, usuario) {
            if (err) {
                callback(err);
            } else if (typeof usuario === "undefined") { // el usuario no existe
                callback(null, false);
            } else if (usuario.contraseña !== pass) { // la contraseña es incorrecta
                callback(null, false);
            } else { // usuario correcto
                callback(null, usuario);
            }
        });
    }
));












//____CURSOS____


app.post("/nuevoCurso", function(request, response) {
    var dao = require("./dao_curso");
    var datosErroneos = false; //consideramos de primeras que los datos no son erróneos
    var curso = {
        titulo: request.body.titulo,
        descripcion: request.body.descripcion,
        localidad: request.body.localidad,
        direccion: request.body.direccion,
        plazas: request.body.plazas,
        fecha_inicio: request.body.fecha_inicio,
        fecha_finalizacion: request.body.fecha_finalizacion
    };
    for (var p in curso) { // comprobamos que los datos están bien insertados
        if (isEmpty(curso[p]) && !datosErroneos || isNaN(curso.plazas)) {
            datosErroneos = true;
            response.status(400);
            response.end();
        }
    }
    if (!datosErroneos) { //si todo fue bien, se da de alta
        dao.altaCurso(curso, function(err, id) {
            if (err) {
                response.status(500);
                response.end();
            } else {
                request.body.id = id;
                insertarHorarios(request.body); // insertamos los horarios del curso
                // devolvemos el id del curso insertado
                response.json({ id: id });
            }
        });
    }
});

function insertarHorarios(curso) {
    var dao = require("./dao_curso");
    if (typeof curso.lunes_inicio !== "undefined") {
        if (typeof curso.lunes_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "lunes", curso.lunes_inicio, curso.lunes_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.martes_inicio !== "undefined") {
        if (typeof curso.martes_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "martes", curso.martes_inicio, curso.martes_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.miercoles_inicio !== "undefined") {
        if (typeof curso.miercoles_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "miercoles", curso.miercoles_inicio, curso.miercoles_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.jueves_inicio !== "undefined") {
        if (typeof curso.jueves_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "jueves", curso.jueves_inicio, curso.jueves_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.viernes_inicio !== "undefined") {
        if (typeof curso.viernes_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "viernes", curso.viernes_inicio, curso.viernes_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.sabado_inicio !== "undefined") {
        if (typeof curso.sabado_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "sabado", curso.sabado_inicio, curso.sabado_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
    if (typeof curso.domingo_inicio !== "undefined") {
        if (typeof curso.domingo_fin !== "undefined") {
            var dao = require("./dao_curso");
            dao.insertarHorario(curso.id, "domingo", curso.domingo_inicio, curso.domingo_fin, function(err) {
                if (err) console.log(err.message);
            });
        }
    }
}

app.put("/updateCurso/:id", function(request, response) {
    var dao = require("./dao_curso");
    var datosErroneos = false;
    var curso = {
        titulo: request.body.titulo,
        descripcion: request.body.descripcion,
        localidad: request.body.localidad,
        direccion: request.body.direccion,
        plazas: request.body.plazas,
        fecha_inicio: request.body.fecha_inicio,
        fecha_finalizacion: request.body.fecha_finalizacion
    };
    for (var p in curso) { // comprobamos que los datos están bien insertados
        if (isEmpty(curso[p]) && !datosErroneos || isNaN(curso.plazas) || isNaN(Number(request.params.id))) {
            datosErroneos = true;
            response.status(400);
            response.end();
        }
    }
    if (!datosErroneos) {
        request.body.id = request.params.id;
        updateHorarios(request.body);
        dao.updateCurso(Number(request.params.id), curso, function(err, columnasModificadas) {
            if (err) {
                response.status(500);
                console.log(err.message);
            } else if (columnasModificadas === 0) {
                response.status(400);
            }
            response.end();
        });
    }
});

function updateHorarios(curso) {
    var dao = require("./dao_curso");
    dao.borrarHorario(curso.id, function(err) {
        if (err) console.log(err.message);
        else {
            insertarHorarios(curso);
        }
    });
}

app.delete("/deleteCurso/:id", function(request, response) {
    var dao = require("./dao_curso");
    if (isNaN(request.params.id)) { // el id debe ser numérico
        response.status(400);
        response.end();
    } else { // se da de baja el curso
        dao.bajaCurso(request.params.id, function(err) {
            if (err)
                response.status(500);
            response.end();
        });
    }
});


app.get("/getCurso/:id", function(request, response) {
    var dao = require("./dao_curso");
    if (isNaN(request.params.id)) {
        response.status(400);
        response.end();
    } else {
        dao.getCurso(request.params.id, function(err, curso) {
            if (err) {
                response.status(500);
                response.end();
            } else if (typeof curso === "undefined") {
                response.status(404);
                response.end();
            } else {
                var dao_inscripciones = require("./dao_inscripciones");
                dao_inscripciones.getNumeroInscritos(request.params.id, function(err, inscritos) {
                    if (err) {
                        callback(err);
                    } else {
                        curso.vacantes = curso.plazas - inscritos;
                        response.json({ curso: curso });
                    }
                });
            }
        });
    }
});

app.get("/buscarPorNombre", function(request, response) {
    var dao = require("./dao_curso"),
        str = '%' + request.query.str.replace(/\'/g, '') + '%',
        num = Number(request.query.num),
        pos = Number(request.query.pos) - 1;

    if (isNaN(num) || isNaN(pos) || pos < 0 || num < 0) {
        response.status(400);
        response.end();
    } else {
        dao.buscarPorNombre(str, num, pos, function(err, result) {
            if (err) {
                console.log(err.message);
                response.status(500);
                response.end();
            } else {
                dao.resultadosPorNombre(str, function(err, numero_total) {
                    if (err) {
                        console.log(err.message);
                        response.status(500);
                        response.end();
                    } else {
                        response.json({ numero_total: numero_total, resultado: result });
                    }
                });
            }
        });
    }
});

app.put("/subirImagen/:id_curso", upload.single('foto'), function(request, response) {

    if (isNaN(request.params.id_curso)) {
        response.status(400);
        response.end();
    }
    var urlFichero,
        curso = request.params.id_curso,
        dao = require("./dao_curso");

    dao.existeCurso(curso, function(err, result_curso) { // comprobamos que el curso existe
        if (err) {
            console.log(err.message);
            response.status(500);
            response.end();
        } else if (typeof result_curso === "undefined") {
            response.status(400);
            response.end();
        } else {
            if (request.file) { // comprobamos que ha enviado un archivo
                urlFichero = path.join("img", request.file.filename);
                var fichDestino = path.join("public", urlFichero);
                fs.createReadStream(request.file.path).pipe(fs.createWriteStream(fichDestino));
                dao.insertarImagen(curso, urlFichero, function(err, result) {
                    if (err) {
                        console.log(err.message)
                        response.status(500);
                    }
                    response.end();
                });
            } else {
                response.status(400);
                response.end();
            }
        }
    });
});

app.get("/imagen/:id_curso", function(request, response) {
    if (isNaN(request.params.id_curso)) {
        response.status(400);
        response.end();
    }
    var dao = require("./dao_curso");
    dao.getImagen(request.params.id_curso, function(err, imagen) {
        if (err) {
            console.log(err.message);
            response.status(500);
            response.end();
        }
        if (typeof imagen === "undefined" || imagen === null) {
            response.status(404);
            response.end();
        } else {
            var link = "https://localhost:5555/";
            link += imagen;
            response.redirect(link);
        }
    });
});

app.get("/getCursos/:correo", passport.authenticate('basic', { session: false }), function(request, response) {
    if (isEmpty(request.params.correo)) {
        response.status(400);
        response.end();
    } else {
        var dao_usuario = require("./dao_usuario");
        dao_usuario.getUserByEmail(request.params.correo, function(err, user) {
            if (err) {
                console.log(err.message);
                response.status(500);
                response.end();
            } else if (user === undefined) {
                response.status(404);
                response.end();
            } else {
                var dao_inscripciones = require("./dao_inscripciones");
                dao_inscripciones.getCursosInscrito(user.id, null, null, function(err, cursos) {
                    if (err) {
                        console.log(err.message);
                        response.status(500);
                        response.end();
                    } else {
                        if (typeof cursos === "undefined") {
                            response.json({ cursos: [] });
                        } else {
                            response.json({ cursos: cursos });
                        }
                    }
                });
            }
        });
    }
});

app.get("/getHorario/:id_curso", function(request, response) {
    if (isNaN(request.params.id_curso)) {
        response.status(400);
        response.end();
    }
    var dao = require("./dao_curso");
    dao.getHorario(request.params.id_curso, function(err, horario) {
        response.json({ horario: horario });
    });
});











//____USUARIOS____

app.post("/nuevoUsuario", function(request, response) {
    var datosErroneos = false, //consideramos de primeras que los datos no son erróneos
        dao = require("./dao_usuario"),
        usuario = {
            email: request.body.email,
            password: request.body.password,
            nombre: request.body.nombre,
            apellidos: request.body.apellidos,
            fechaDeNacimiento: request.body.fechaDeNacimiento,
            sexo: request.body.sexo
        };
    for (var p in usuario) { // comprobamos que los datos están bien insertados
        if (isEmpty(usuario[p]) && !datosErroneos || !esFechaValida(usuario.fechaDeNacimiento)) {
            datosErroneos = true;
            response.status(400);
            response.end();
        }
    }
    if (!datosErroneos) { //si todo fue bien, se da de alta
        dao.altaUsuario(usuario, function(err, user) {
            if (err) {
                console.log(err.message);
                response.status(500);
                response.end();
            } else if (typeof user === "undefined"){
                response.status(400);
                response.end();
            } else {
                response.status(200);
                response.end();
            }
        });
    }
});



app.post("/inscribir", passport.authenticate('basic', { session: false }), function(request, response) {

    var dao_curso = require("./dao_curso"),
        id_curso = request.body.id_curso;
    dao_curso.existeCurso(id_curso, function(err, result_curso) { // comprobamos que el curso existe
        if (err) {
            console.log(err.message);
            response.status(500);
            response.end();
        } else if (typeof result_curso === "undefined") {
            response.status(400);
            response.end();
        } else {
            var dao_usuario = require("./dao_usuario");
            dao_usuario.getUserByEmail(request.body.correo_usuario, function(err, result_usuario) { // comprobamos que el usuario existe
                if (err) {
                    console.log(err.message);
                    response.status(500);
                    response.end();
                } else if (typeof result_usuario === "undefined") {
                    response.status(400);
                    response.end();
                } else {
                    var dao_inscripciones = require("./dao_inscripciones");
                    dao_inscripciones.inscribir(id_curso, result_usuario.id, function(err, exito) { // inscribimos el usuario en el curso
                        if (err) {
                            console.log(err.message);
                        } else {
                            // comprobamos el informe de cosas que pueden haber ocurrido
                            if (exito) {
                                response.end();
                            } else {
                                response.status(400);
                                response.end();
                            }
                        }
                    });
                }
            });
        }
    });
});

app.post("/login", passport.authenticate('basic', { session: false }), function(request, response) {
    response.json({ usuario: request.user.correo });
});




app.get("/tabla/:correo_usuario/:lunes/:domingo", passport.authenticate('basic', { session: false }), function(request, response) {
    var dao_usuario = require("./dao_usuario");
    dao_usuario.getUserByEmail(request.params.correo_usuario, function(err, user) {
        if (err) {
            console.log(err.message);
            response.status(500);
            response.end();
        } else if (user === undefined) {
            response.status(404);
            response.end();
        } else {
            var dao_inscripciones = require("./dao_inscripciones");
            dao_inscripciones.getCursosInscrito(user.id, request.params.lunes, request.params.domingo, function(err, cursos) {
                if (err) {
                    console.log(err.message);
                    response.status(500);
                    response.end();
                } else {
                    if (typeof cursos === "undefined") {
                        cursos = [];
                    }
                    conseguirHorarios(cursos, function(err, result) {
                        conseguirFilas(result, request.params.correo_usuario, function(err, todo) {
                            if (err) {
                                console.log(err.message);
                                response.status(500);
                                response.end();
                            } else{
                                response.json(todo);
                            }
                        });
                    });
                }
            });
        }
    });
});

function conseguirHorarios(cursos, callback) {
    var horas = new Array();
    var cursos_restantes = cursos.length;
    conseguirHorariosRecursiva(horas, cursos_restantes, cursos, callback);
}

function conseguirHorariosRecursiva(horas, cursos_restantes, cursos, callback) {
    if (cursos_restantes === 0) {
        callback(null, horas);
    } else {
        var dao = require("./dao_curso");
        dao.getHorario(cursos[cursos_restantes - 1].id, function(err, horario) {
            if (err) {
                callback(err);
            } else {
                for (var i = 0; i < horario.length; i++) horas.push(horario[i]);
                cursos_restantes--;
                conseguirHorariosRecursiva(horas, cursos_restantes, cursos, callback);
            }
        });
    }
}

function conseguirFilas(horas, usuario, callback) {
    var array = new Array();
    for (var i = 0; i < horas.length; i++) {
        if (array.indexOf(horas[i].hora_inicio) == -1)
            array.push(horas[i].hora_inicio);
        if (array.indexOf(horas[i].hora_finalizacion) == -1)
            array.push(horas[i].hora_finalizacion);
    }
    array.sort();
    getCursosInscritosPorHora(usuario, horas, function(err, datos) {
        if (err) {
            console.log(err.message);
        } else {
            callback(null, { horas_distintas: array.length, horas: array, datos: datos });
        }
    });
};

function getCursosInscritosPorHora(usuario, horas, callback) {
    var datos = new Array();
    var horas_restantes = horas.length;
    var dao_usuario = require("./dao_usuario");
    dao_usuario.getUserByEmail(usuario, function(err, user) {
        getCursosInscritosPorHoraRecursiva(user.id, horas, datos, horas_restantes, callback);
    });
}

function getCursosInscritosPorHoraRecursiva(usuario, horas, datos, horas_restantes, callback) {
    if (horas_restantes === 0) {
        callback(null, datos);
    } else {
        var dao_inscripciones = require("./dao_inscripciones");
        dao_inscripciones.getCursosInscritosPorHora(usuario, horas[Number(horas_restantes - 1)].hora_inicio, horas[Number(horas_restantes - 1)].dia_semana, function(err, result) {
            if (typeof result !== "undefined") {
                datos.push({
                    hora_inicio: result[0].hora_inicio,
                    hora_finalizacion: result[0].hora_finalizacion,
                    dia_semana: result[0].dia_semana,
                    titulo: result[0].titulo,
                    fecha_inicio: result[0].fecha_inicio,
                    fecha_finalizacion: result[0].fecha_finalizacion
                });
            }
            horas_restantes--;
            getCursosInscritosPorHoraRecursiva(usuario, horas, datos, horas_restantes, callback);
        });

    }
}











// ____EXTRA____




servidor.listen(config.port, function(err) {
    console.log("Escuchando en el puerto " + config.port);
});

// app.listen(3000, function(err) {console.log("Escuchando en el puerto 3000");})

function isEmpty(elem) {
    return elem.length === 0 || !elem.trim();
}

function esFechaValida(fecha) {
    // comprobamos que no está vacía, que de verdad es una fecha y que no es posterior al día de hoy
    return (!isEmpty(fecha) && !isNaN(Date.parse(fecha)) && esAnteriorAHoy(fecha));
}

function esAnteriorAHoy(fecha) {
    return Date.parse(fecha) < Date.parse(new Date());
}
