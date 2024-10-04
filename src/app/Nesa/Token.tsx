import * as THREE from 'three'
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import vertexShaderHeader from './vertexShaderHeader.glsl'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

import vertexShader from './vertexShader.glsl'
import fragmentShader from './fragmentShader.glsl'

import freshnelVS from './freshnelVS.glsl'
import freshnelFS from './freshnelFS.glsl'
import freshnelFSEnd from './freshnelFSEnd.glsl'

import UVAnimShaderFS from './UVAnimShaderFS.glsl'
import UVAnimShaderVS from './UVAnimShaderVS.glsl'

import { create } from 'zustand'

//import fb from "./export/Layer1.fb"

import empties from './export/empties.obj'

/*import section0 from "./export/section0.fb"
import section1 from "./export/section1.fb"
import section2 from "./export/section2.fb"
import section3 from "./export/section3.fb"
import section4 from "./export/section4.fb"
import section5 from "./export/section5.fb"
*/

import quad from './export/Layer 1.fb'
import quad001 from './export/Layer 2.fb'
import quad002 from './export/Layer 3.fb'

import Layer1Arrow1 from './export/Layer 1 Arrow 1.obj'
import Layer1Arrow2 from './export/Layer 1 Arrow 2.obj'
import Layer1Arrow3 from './export/Layer 1 Arrow 3.obj'
import Layer1Arrow4 from './export/Layer 1 Arrow 4.obj'
import Layer1Arrow5 from './export/Layer 1 Arrow 5.obj'
import Layer1Arrow6 from './export/Layer 1 Arrow 6.obj'
import Layer1Arrow7 from './export/Layer 1 Arrow 7.obj'

import Layer2Arrow1 from './export/Layer 2 Arrow 1.obj'
import Layer2Arrow2 from './export/Layer 2 Arrow 2.obj'
import Layer2Arrow3 from './export/Layer 2 Arrow 3.obj'
import Layer2Arrow4 from './export/Layer 2 Arrow 4.obj'
import Layer2Arrow5 from './export/Layer 2 Arrow 5.obj'

import Layer1TOPArrow from './export/Layer 1 TOP Arrow.obj'
import Layer2TOPArrow from './export/Layer 2 TOP Arrow.obj'
import Layer3TOPArrow from './export/Layer 3 TOP Arrow.obj'

import { clamp, lerp } from 'three/src/math/MathUtils.js'

import dynamic from 'next/dynamic'

const Lottie = dynamic(() => import('./Lottie').then((module) => module.default), { ssr: false })

export const overlap = 0.35

var ballRotation = new THREE.Quaternion()
var mousePosition = new THREE.Vector4(0.0, 0.0, 0.0, 1.0)
var ray = new THREE.Ray()

ballRotation.setFromEuler(new THREE.Euler(65.0, 0.0, 0.0, 'ZYX'))

var normal = new THREE.Vector3(0.0, 0.0, 0.0)
var hitpoint = new THREE.Vector3(1000.0, 10000, 1000)
var vertices: number[] = []
var normals: number[] = []
var uvs: number[] = []
var indices: number[] = []
var ballIndex: number[] = []
var ballSections: number[] = []
var ballCenters: number[] = []

var sphere = BufferGeometryUtils.toCreasedNormals(new THREE.IcosahedronGeometry(1.0, 2), 40)
//sphere = new THREE.IcosahedronGeometry(1.0, 1)
//sphere.computeVertexNormals();
var dbg = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.03, 0),
  new THREE.MeshBasicMaterial({ color: 'red' })
)
var sphereRadius = 0.25 * 0.5

var planeNormal = new THREE.Vector3(0.0, 1.0, 0.0)
planeNormal.normalize()
var plane = new THREE.Plane(planeNormal, 0.0)

planeNormal.multiplyScalar(2.0)
plane.translate(planeNormal)

var origo = new THREE.Vector3(0.0, -10.0, 0.0)
var p = new THREE.Vector3(0.0, 2.0, 0.0)

var minDistance = 1000000.0
var maxDistance = -1000000.0
var mouseSpeed = 0.0

var prevMousePosition = new THREE.Vector3()
var mouseDelta = new THREE.Vector3()

const addSphere = (position: THREE.Vector3, segment: number, index: number) => {
  var vertexStart = vertices.length
  var positions = sphere.attributes['position'].array
  var normal = sphere.attributes['normal'].array

  var uv = sphere.attributes['uv'].array

  for (var i = 0; i < positions.length / 3; i++) {
    vertices.push(positions[i * 3 + 0] * sphereRadius + position.x)
    vertices.push(positions[i * 3 + 1] * sphereRadius + position.y)
    vertices.push(positions[i * 3 + 2] * sphereRadius + position.z)

    ballCenters.push(position.x)
    ballCenters.push(position.y)
    ballCenters.push(position.z)

    normals.push(normal[i * 3 + 0])
    normals.push(normal[i * 3 + 1])
    normals.push(normal[i * 3 + 2])

    uvs.push(uv[i * 2 + 0])
    uvs.push(uv[i * 2 + 1])

    indices.push(i + vertexStart + 0)
    indices.push(i + vertexStart + 1)
    indices.push(i + vertexStart + 2)

    p.copy(position)

    p.sub(origo)
    var dst = p.length() + index // plane.distanceToPoint(position) + index

    minDistance = Math.min(minDistance, dst)
    maxDistance = Math.max(maxDistance, dst)

    ballIndex.push(dst)
    ballSections.push(segment)
  }
}

//var perspectiveCamera: THREE.PerspectiveCamera | undefined = undefined
var orthographicCamera = new THREE.OrthographicCamera(
  -10.25 * 0.5,
  10.25 * 0.5,
  10.25 * 0.5,
  -10.25 * 0.5,
  -100.0,
  100.0
)

var plane = new THREE.Plane(new THREE.Vector3(0.0, 0.0, 1.0).applyQuaternion(ballRotation), 0.0)

plane.translate(new THREE.Vector3(0.0, 0.0, -2.0))
var ballAdditionalrotation = new THREE.Quaternion()
ballAdditionalrotation.identity()

export interface Timeline {
  time: number
  animTime: number
  mouseX: number
  mouseY: number
  setAnimTime: (_animTime: number) => void
  setTime: (_time: number) => void
  setMousePosition: (_x: number, _y: number) => void
}

export const useTimeline = create<Timeline>((set) => ({
  time: -1.0,
  animTime: -1.0,
  mouseX: 0.0,
  mouseY: 0.0,
  setTime: (time: number) => {
    set((state) => ({ ...state, time: time * objects.timelineLength }))
  },
  setAnimTime: (animTime: number) => {
    set((state) => ({ ...state, animTime: animTime }))
  },
  setMousePosition: (x: number, y: number) => {
    set((state) => ({ ...state, mouseX: x, mouseY: y }))
  }
}))

var objects = JSON.parse(empties)

class UVAnimMaterial extends THREE.ShaderMaterial {
  map2: THREE.IUniform
  uvOffset: THREE.IUniform
  alpha: THREE.IUniform

  constructor() {
    super()
    this.map2 = new THREE.Uniform(null)
    this.uvOffset = new THREE.Uniform(new THREE.Vector2(0, 0))
    this.alpha = new THREE.Uniform(0.3)
    this.blending = THREE.NormalBlending
    this.transparent = true

    this.depthTest = false
  }

  onBeforeCompile(parameters: THREE.WebGLProgramParametersWithUniforms): void {
    parameters.uniforms['map2'] = this.map2
    parameters.uniforms['uvOffset'] = this.uvOffset
    parameters.uniforms['alpha'] = this.alpha

    parameters.fragmentShader = UVAnimShaderFS
    parameters.vertexShader = UVAnimShaderVS
  }
}

export class MyMaterial extends THREE.MeshMatcapMaterial {
  selectedSegment: THREE.IUniform
  selectionTime: THREE.IUniform

  selection: THREE.IUniform

  touchEffect: THREE.IUniform
  touchRadius: THREE.IUniform
  ballScroll: THREE.IUniform
  time: THREE.IUniform

  matcap2: THREE.IUniform
  matcap3: THREE.IUniform

  constructor() {
    super()

    this.selectedSegment = new THREE.Uniform(-1.0)
    this.selectionTime = new THREE.Uniform(1.0)

    this.selection = new THREE.Uniform(new THREE.Vector3(0, 0, 0))

    this.touchEffect = new THREE.Uniform(0.0)
    this.touchRadius = new THREE.Uniform(0.0)

    this.ballScroll = new THREE.Uniform(0.0)
    this.time = new THREE.Uniform(0.0)

    this.matcap2 = new THREE.Uniform(undefined)
    this.matcap3 = new THREE.Uniform(undefined)

    this.blending = THREE.NormalBlending
    this.transparent = true
  }

  onBeforeCompile(parameters: THREE.WebGLProgramParametersWithUniforms): void {
    //parameters.vertexShader.replace('')
    //    console.log(parameters.vertexShader)
    parameters.mapUv = `uv0`

    parameters.uniforms['selectedSegment'] = this.selectedSegment
    parameters.uniforms['selectionTime'] = this.selectionTime
    parameters.uniforms['selection'] = this.selection

    parameters.uniforms['touchEffect'] = this.touchEffect
    parameters.uniforms['touchRadius'] = this.touchRadius
    parameters.uniforms['ballScroll'] = this.ballScroll
    parameters.uniforms['time'] = this.time
    parameters.uniforms['matcap2'] = this.matcap2
    parameters.uniforms['matcap3'] = this.matcap3

    parameters.defines = { USE_TANGENT: true }

    parameters.vertexShader = `${vertexShaderHeader}\n${parameters.vertexShader}\n`

    parameters.vertexShader = `#define WAVES (vec3(0.0, 1.0, 0.0) * 0.04 * sin(length(ballCenters.xyz + vec3(3.0, 3.0, 0.0) * 1.6) * 2.0 + time * 0.85))\n${parameters.vertexShader}\n`

    parameters.vertexShader = parameters.vertexShader.replace(
      '#include <fog_vertex>',
      `#include <fog_vertex>\n${freshnelVS}\n`
    )
    parameters.vertexShader = parameters.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n${vertexShader}\n`
    )

    parameters.fragmentShader = `${fragmentShader}\n${parameters.fragmentShader}\n`

    var matcapStart = parameters.fragmentShader.indexOf('#ifdef USE_MATCAP')
    var matcapEnd = parameters.fragmentShader.indexOf('#endif', matcapStart) + '#endif'.length

    parameters.fragmentShader = parameters.fragmentShader.replace(
      parameters.fragmentShader.substring(matcapStart, matcapEnd),
      freshnelFS
    )

    //parameters.fragmentShader = parameters.fragmentShader.replace('#include <common>\n', `#include <common>\n${freshnelFS}\n`);

    parameters.fragmentShader = parameters.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>\n${freshnelFSEnd}\n`
    )
  }
}

var material = new MyMaterial()

var time = 0.0

var quads = [quad, quad001, quad002]

var layers = quads.map((quad, quadi) => {
  vertices = []
  normals = []
  uvs = []
  indices = []
  ballIndex = []
  ballSections = []
  ballCenters = []

  var geom = new THREE.BufferGeometry()

  {
    {
      var points = JSON.parse(quad)

      minDistance = 1000000.0
      maxDistance = -1000000.0

      for (var pos of points.vertices) {
        addSphere(new THREE.Vector3(pos[0], pos[1], pos[2]), 0, 0.0)
      }
    }
  }

  ballIndex = ballIndex.map((n) => n - minDistance + quadi * 10.0) // (2 - quadi) * 10.0)
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  geom.setAttribute('ballIndex', new THREE.BufferAttribute(new Float32Array(ballIndex), 1))
  geom.setAttribute('ballSections', new THREE.BufferAttribute(new Int8Array(ballSections), 1))
  geom.setAttribute('ballCenters', new THREE.BufferAttribute(new Float32Array(ballCenters), 3))

  //var ball = new TokenMesh(new THREE.IcosahedronGeometry(1.0, 0), material);
  var ball = new THREE.Mesh(geom, material)

  ball.renderOrder = -1000

  return ball
})

var Layer1Arrow1Obj: Arrow
var Layer3TOPArrowObj: Arrow
var Layer2Arrow1Obj: Arrow
var Layer2Arrow2Obj: Arrow
var Layer2Arrow3Obj: Arrow
var Layer2Arrow4Obj: Arrow
var Layer2Arrow5Obj: Arrow
var Layer2TOPArrowObj: Arrow

var Layer1Arrow1Obj: Arrow
var Layer1Arrow2Obj: Arrow
var Layer1Arrow3Obj: Arrow
var Layer1Arrow4Obj: Arrow
var Layer1Arrow5Obj: Arrow
var Layer1Arrow6Obj: Arrow
var Layer1Arrow7Obj: Arrow

var Layer1TOPArrowObj: Arrow

var lineMaterial: UVAnimMaterial
var headMaterial: UVAnimMaterial

class Arrow {
  head: THREE.Mesh
  line: THREE.Mesh
  parent: THREE.Mesh
  uvmax: number
  progress: number
  element: any

  constructor(data: string, element: any) {
    var geom = new THREE.BufferGeometry()

    var points = JSON.parse(data)

    this.progress = 0.0
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points.vertices), 3))
    geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(points.uvs), 2))

    this.uvmax = 0.0
    points.uvs.forEach((uv: number, i: number) => {
      if (i % 2 == 0) {
        if (uv > this.uvmax) {
          this.uvmax = uv
        }
      }
    })

    geom.setIndex(points.triangles)

    //var ball = new TokenMesh(new THREE.IcosahedronGeometry(1.0, 0), material);

    var loader = new THREE.TextureLoader()

    if (headMaterial == undefined) {
      var head = loader.load('/arrow_texture_arrowHead.png')
      head.wrapS = THREE.ClampToEdgeWrapping
      head.wrapT = THREE.ClampToEdgeWrapping
      head.generateMipmaps = false
      head.magFilter = THREE.LinearFilter
      head.minFilter = THREE.LinearFilter

      headMaterial = new UVAnimMaterial()

      headMaterial.map2.value = head
      headMaterial.depthTest = false
      headMaterial.needsUpdate = true
    }

    if (lineMaterial == undefined) {
      var head = loader.load('/arrow_texture_dashedLine.png')
      head.wrapS = THREE.RepeatWrapping
      head.wrapT = THREE.RepeatWrapping
      head.generateMipmaps = false
      head.magFilter = THREE.LinearFilter
      head.minFilter = THREE.LinearFilter

      lineMaterial = new UVAnimMaterial()

      lineMaterial.map2.value = head
      lineMaterial.depthTest = false

      lineMaterial.needsUpdate = true
    }

    this.parent = new THREE.Mesh()

    this.head = new THREE.Mesh(geom, headMaterial)
    this.line = new THREE.Mesh(geom, lineMaterial)

    this.line.renderOrder = 1000.0
    this.head.renderOrder = 1000.0

    this.parent.add(this.line)
    this.parent.add(this.head)

    this.element = element

    this.head.onBeforeRender = () => this.onBeforeRenderHead()

    this.line.onBeforeRender = () => this.onBeforeRenderLine()
  }
  onBeforeRenderLine() {
    if (this.progress == 0.0) {
      lineMaterial.alpha.value = 0.0
    } else {
      lineMaterial.alpha.value = this.element.color.a
    }
    lineMaterial.uvOffset.value.set(this.progress * -(this.uvmax - 2.0), 0.0)
  }
  onBeforeRenderHead() {
    if (this.progress == 0.0) {
      headMaterial.alpha.value = 0.0
    } else {
      headMaterial.alpha.value = this.element.color.a
    }

    headMaterial.uvOffset.value.set(this.progress * -(this.uvmax - 2.0), 0.0)
  }

  setProgress(progress: number) {
    this.progress = progress
  }
}

objects.empties = objects.empties.map((obj: any) => {
  var rv = obj

  if (obj.name == 'Layer 1') {
    obj.dbg = layers[0]
  } else if (obj.name == 'Layer 2') {
    obj.dbg = layers[1]
  } else if (obj.name == 'Layer 3') {
    obj.dbg = layers[2]
    //} else if (obj.name == 'Layer 1 Arrow 1') {
    // obj.dbg = Layer1Arrow1Mesh
  } else {
    obj.dbg = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.03, 0),
      new THREE.MeshBasicMaterial({
        color: 'red'
      })
    )
  }

  obj.absolutePosition = new THREE.Vector4()
  obj.dbg.position.set(obj.position.x, obj.position.y, obj.position.z)
  obj.color = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 }
  obj.scale = { x: 1.0, y: 1.0, z: 1.0 }

  return rv
})

const BlobTransform = React.memo(() => {
  var rotation = new THREE.Quaternion()
  rotation.identity()

  const timeline = useTimeline()

  useFrame((state, delta) => {
    var { camera } = state
    time = lerp(time, timeline.time, 2.0 / 60.0)
    timeline.setAnimTime(time)
    var s = timeline.animTime

    mousePosition.set(timeline.mouseX, timeline.mouseY, 0.0, 1.0)
    mousePosition.applyMatrix4(camera.projectionMatrixInverse)
    mousePosition.applyMatrix4(camera.matrixWorld)

    mousePosition.set(
      mousePosition.x / mousePosition.w,
      mousePosition.y / mousePosition.w,
      mousePosition.z / mousePosition.w,
      1.0
    )

    /*ray.origin = camera.position;
    ray.direction.set(
      mousePosition.x / mousePosition.w - camera.position.x,
      mousePosition.y / mousePosition.w - camera.position.y,
      mousePosition.z / mousePosition.w - camera.position.z);*/
    ray.origin.set(mousePosition.x, mousePosition.y, mousePosition.z)
    ray.direction.set(0.0, 0.0, -1.0)

    ray.intersectPlane(plane, hitpoint)

    dbg.position.copy(hitpoint)
    normal.copy(camera.position)
    normal.normalize()

    normal.cross(hitpoint)

    ballAdditionalrotation.identity()

    if (
      mousePosition.x >= -1.0 &&
      mousePosition.x <= 1.0 &&
      mousePosition.y >= -1.0 &&
      mousePosition.y <= 1.0
    ) {
      mouseDelta.copy(prevMousePosition)
      mouseDelta.sub(mousePosition)
      mouseDelta.set(mouseDelta.x, mouseDelta.y, 0.0)

      if (delta != 0.0) {
        mouseSpeed = lerp(
          mouseSpeed,
          clamp((mouseDelta.length() / delta) * 0.6, 0.0, 1.0),
          2.0 / 60.0
        )
      }

      prevMousePosition.copy(mousePosition)
    }

    normal.normalize()
    //ballAdditionalrotation.setFromAxisAngle(normal, l)

    //ballAdditionalrotation.multiplyQuaternions(ballRotation, ballAdditionalrotation)
    material.selection.value = hitpoint
    material.touchRadius.value =
      lerp(0.000001, 0.45, 1.0 - Math.pow(1.0 - clamp(mouseSpeed, 0.0, 1.0), 1.6)) * 6.0 // * 0.8 * 0.5;
    material.touchEffect.value = 0.5

    var size = maxDistance - minDistance

    var a = 0.0

    if (s < 35) {
      s = clamp((s - 0.0) / 35.0, 0.0, 1.0)
      a = 0.0
    } else if (s < 80) {
      s = clamp((s - 37.0) / (80.0 - 37.0), 0.0, 1.0)
      a = 10.0
    } else {
      s = clamp((s - 103.0) / (137.0 - 103.0), 0.0, 1.0)
      a = 20.0
    }

    Layer1Arrow4Obj.setProgress(clamp((timeline.animTime - 1.0) / (20.0 - 1.0), 0.0, 1.0))

    Layer1Arrow3Obj.setProgress(clamp((timeline.animTime - 5.0) / (25.0 - 5.0), 0.0, 1.0))
    Layer1Arrow5Obj.setProgress(clamp((timeline.animTime - 5.0) / (25.0 - 5.0), 0.0, 1.0))

    Layer1Arrow1Obj.setProgress(clamp((timeline.animTime - 11.0) / (35.0 - 11.0), 0.0, 1.0))
    Layer1Arrow7Obj.setProgress(clamp((timeline.animTime - 11.0) / (35.0 - 11.0), 0.0, 1.0))

    Layer1Arrow2Obj.setProgress(clamp((timeline.animTime - 8.0) / (30.0 - 8.0), 0.0, 1.0))
    Layer1Arrow6Obj.setProgress(clamp((timeline.animTime - 8.0) / (30.0 - 8.0), 0.0, 1.0))

    Layer1TOPArrowObj.setProgress(clamp((timeline.animTime - 1.0) / (30.0 - 1.0), 0.0, 1.0))

    Layer2Arrow1Obj.setProgress(clamp((timeline.animTime - 72.0) / (92.0 - 72.0), 0.0, 1.0))
    Layer2Arrow5Obj.setProgress(clamp((timeline.animTime - 72.0) / (92.0 - 72.0), 0.0, 1.0))

    Layer2Arrow2Obj.setProgress(clamp((timeline.animTime - 68.0) / (92.0 - 68.0), 0.0, 1.0))
    Layer2Arrow4Obj.setProgress(clamp((timeline.animTime - 68.0) / (92.0 - 68.0), 0.0, 1.0))

    Layer2Arrow3Obj.setProgress(clamp((timeline.animTime - 66.0) / (86.0 - 66.0), 0.0, 1.0))

    Layer2TOPArrowObj.setProgress(clamp((timeline.animTime - 34.0) / (70.0 - 34.0), 0.0, 1.0))

    Layer3TOPArrowObj.setProgress(clamp((timeline.animTime - 103.0) / (135.0 - 103.0), 0.0, 1.0))
    material.ballScroll.value = lerp(-(1 / 0.3) + a, size + a, clamp(s, 0.0, 1.0)) // * 106 * 4.0 * 2.0 * (1.0 / 3.0);

    material.time.value = state.clock.elapsedTime

    var { gl } = state

    time = Math.max(time, 0.0)
    objects.empties.forEach((element: any) => {
      var T = clamp(time, element.startFrame, element.endFrame)
      var t = Math.floor(T)

      //if (t >= element.startFrame && t < element.endFrame)
      {
        var nextT = Math.min(t + 1, element.endFrame)

        var c = T - t

        if (t < element.frames.length && nextT < element.frames.length) {
          element.dbg.position.set(
            lerp(element.frames[t].location.x, element.frames[nextT].location.x, c),
            lerp(element.frames[t].location.y, element.frames[nextT].location.y, c),
            lerp(element.frames[t].location.z, element.frames[nextT].location.z, c)
          )

          element.color.r = lerp(element.frames[t].color.r, element.frames[nextT].color.r, c)
          element.color.g = lerp(element.frames[t].color.g, element.frames[nextT].color.g, c)
          element.color.b = lerp(element.frames[t].color.g, element.frames[nextT].color.b, c)
          element.color.a = lerp(element.frames[t].color.a, element.frames[nextT].color.a, c)

          //element.dbg.material.color.set(element.color.a, element.color.a, element.color.a, element.color.a)

          element.scale.x = lerp(element.frames[t].scale.x, element.frames[nextT].scale.x, c)
          element.scale.y = lerp(element.frames[t].scale.y, element.frames[nextT].scale.y, c)
          element.scale.z = lerp(element.frames[t].scale.z, element.frames[nextT].scale.z, c)
        }
      }

      element.absolutePosition.set(
        element.dbg.position.x,
        element.dbg.position.y,
        element.dbg.position.z,
        1.0
      )
      element.absolutePosition.applyMatrix4(orthographicCamera.matrixWorldInverse)
      element.absolutePosition.applyMatrix4(orthographicCamera.projectionMatrix)

      if (element.absolutePosition.w != 0.0) {
        element.absolutePosition.x /= element.absolutePosition.w
        element.absolutePosition.y /= element.absolutePosition.w
      }

      if (element.absolutePosition.w != 0.0) {
        element.absolutePosition.x =
          (element.absolutePosition.x + 1.0) * 0.5 * gl.domElement.clientWidth
        element.absolutePosition.y =
          (-element.absolutePosition.y + 1.0) * 0.5 * gl.domElement.clientHeight
      }
    })
  })

  return <></>
})

BlobTransform.displayName = 'BlobTransform'

const NesaUI = React.memo(() => {
  var scene = new THREE.Scene()

  scene.add(orthographicCamera)

  React.useEffect(() => {}, [])

  return <></>
})

const Nesa = React.memo(() => {
  const { scene, camera } = useThree()
  React.useEffect(() => {
    scene.clear()

    //scene.add(dbg)

    layers.forEach((layer) => scene.add(layer))

    var loader = new THREE.TextureLoader()
    material.matcap = loader.load('/matcap_black_new_1.png')
    material.matcap2.value = loader.load('/matcap_black_new_2.png')
    material.matcap3.value = loader.load('/matcap_black_new_3.png')

    orthographicCamera = camera as THREE.OrthographicCamera
    orthographicCamera.left = -10.25 * 0.5
    orthographicCamera.right = 10.25 * 0.5
    orthographicCamera.top = 10.25 * 0.5
    orthographicCamera.bottom = -10.25 * 0.5
    orthographicCamera.far = 100.0
    orthographicCamera.near = -100.0
    orthographicCamera.updateMatrix()
    orthographicCamera.updateProjectionMatrix()

    objects.empties.forEach((element: any) => {
      //  scene.add(element.dbg)
      if (element.name == 'Layer 1 Arrow 1') {
        Layer1Arrow1Obj = new Arrow(Layer1Arrow1, element)
        element.dbg = Layer1Arrow1Obj.parent
      } else if (element.name == 'Layer 1 Arrow 2') {
        Layer1Arrow2Obj = new Arrow(Layer1Arrow2, element)
        element.dbg = Layer1Arrow2Obj.parent
      } else if (element.name == 'Layer 1 Arrow 3') {
        Layer1Arrow3Obj = new Arrow(Layer1Arrow3, element)
        element.dbg = Layer1Arrow3Obj.parent
      } else if (element.name == 'Layer 1 Arrow 4') {
        Layer1Arrow4Obj = new Arrow(Layer1Arrow4, element)
        element.dbg = Layer1Arrow4Obj.parent
      } else if (element.name == 'Layer 1 Arrow 5') {
        Layer1Arrow5Obj = new Arrow(Layer1Arrow5, element)
        element.dbg = Layer1Arrow5Obj.parent
      } else if (element.name == 'Layer 1 Arrow 6') {
        Layer1Arrow6Obj = new Arrow(Layer1Arrow6, element)
        element.dbg = Layer1Arrow6Obj.parent
      } else if (element.name == 'Layer 1 Arrow 7') {
        Layer1Arrow7Obj = new Arrow(Layer1Arrow7, element)
        element.dbg = Layer1Arrow7Obj.parent
        /* */
      } else if (element.name == 'Layer 2 Arrow 1') {
        Layer2Arrow1Obj = new Arrow(Layer2Arrow1, element)
        element.dbg = Layer2Arrow1Obj.parent
      } else if (element.name == 'Layer 2 Arrow 2') {
        Layer2Arrow2Obj = new Arrow(Layer2Arrow2, element)
        element.dbg = Layer2Arrow2Obj.parent
      } else if (element.name == 'Layer 2 Arrow 3') {
        Layer2Arrow3Obj = new Arrow(Layer2Arrow3, element)
        element.dbg = Layer2Arrow3Obj.parent
      } else if (element.name == 'Layer 2 Arrow 4') {
        Layer2Arrow4Obj = new Arrow(Layer2Arrow4, element)
        element.dbg = Layer2Arrow4Obj.parent
      } else if (element.name == 'Layer 2 Arrow 5') {
        Layer2Arrow5Obj = new Arrow(Layer2Arrow5, element)
        element.dbg = Layer2Arrow5Obj.parent
      } else if (element.name == 'Layer 1 TOP Arrow') {
        Layer1TOPArrowObj = new Arrow(Layer1TOPArrow, element)
        element.dbg = Layer1TOPArrowObj.parent
      } else if (element.name == 'Layer 2 TOP Arrow') {
        Layer2TOPArrowObj = new Arrow(Layer2TOPArrow, element)
        element.dbg = Layer2TOPArrowObj.parent
      } else if (element.name == 'Layer 3 TOP Arrow') {
        Layer3TOPArrowObj = new Arrow(Layer3TOPArrow, element)
        element.dbg = Layer3TOPArrowObj.parent
      }
      element.dbg.element = element
    })

    scene.add(Layer2Arrow1Obj.parent)
    scene.add(Layer2Arrow2Obj.parent)
    scene.add(Layer2Arrow3Obj.parent)
    scene.add(Layer2Arrow4Obj.parent)
    scene.add(Layer2Arrow5Obj.parent)

    scene.add(Layer1Arrow1Obj.parent)
    scene.add(Layer1Arrow2Obj.parent)
    scene.add(Layer1Arrow3Obj.parent)
    scene.add(Layer1Arrow4Obj.parent)
    scene.add(Layer1Arrow5Obj.parent)
    scene.add(Layer1Arrow6Obj.parent)
    scene.add(Layer1Arrow7Obj.parent)

    scene.add(Layer1TOPArrowObj.parent)
    scene.add(Layer2TOPArrowObj.parent)
    scene.add(Layer3TOPArrowObj.parent)
  }, [, scene, camera])

  return <BlobTransform />
})

NesaUI.displayName = 'NesaUI'
Nesa.displayName = 'Nesa'

const lottieDef = [
  { json: '/Tini_Icon_Chain.json', name: 'Empty_Icon 6', scale: 1 },
  { json: '/Tini_Icon_Compute.json', name: 'Empty_Icon 5', scale: 1 },
  { json: '/Tini_Icon_Container.json', name: 'Empty_Icon 3', scale: 1 },
  { json: '/Tini_Icon_Market.json', name: 'Empty_Icon 2', scale: 1 },
  { json: '/Tini_Icon_Oracle.json', name: 'Empty_Icon 7', scale: 1 },
  { json: '/Tini_Icon_Sharding.json', name: 'Empty_Icon 4', scale: 1 },
  { json: '/Tini_Icon_Encryption.json', name: 'Empty_Icon 1', scale: 1 },

  { json: '/Cryptocurrency_1.json', name: 'Empty_Icon Layer2 1', scale: 1.75 },
  { json: '/Cryptocurrency_2.json', name: 'Empty_Icon Layer2 2', scale: 1.75 },
  { json: '/Cryptocurrency_3.json', name: 'Empty_Icon Layer2 3', scale: 1.75 },
  { json: '/Cryptocurrency_4.json', name: 'Empty_Icon Layer2 4', scale: 1.75 },
  { json: '/Cryptocurrency_5.json', name: 'Empty_Icon Layer2 5', scale: 1.75 }
]

interface AlignedViewProps {
  align: string
  elementName: string
  children: any
}

export const AlignedView = React.memo(({ elementName, children, align }: AlignedViewProps) => {
  const element = objects.empties.find((e: any) => e.name == elementName)
  if (element == null) {
    return null
  }

  var pivotx = 50
  var pivoty = 50

  if (align == 'left') {
    pivotx = 0
  }
  if (align == 'right') {
    pivotx = 100
  }

  return (
    <div
      key={elementName}
      style={{
        transform: `scale(${element.scale.x}) translate(-${pivotx / element.scale.x}%, -${pivoty / element.scale.x}%)`,
        position: 'absolute',
        opacity: element.color.a,
        top: element.absolutePosition.y,
        left: element.absolutePosition.x
      }}
    >
      {children}
    </div>
  )
})

AlignedView.displayName = 'AlignedView'

const Token = React.memo(() => {
  const timeline = useTimeline()

  const [loaded, setLoaded] = React.useState(false)

  if (loaded == false) {
    setLoaded(true)
  }

  return (
    <div
      style={{
        background: 'black',
        /* borderWidth: 2, borderColor: 'blue',*/ position: 'relative',
        width: '100vh',
        height: '100vh'
      }}
    >
      <p style={{ position: 'absolute', top: 0, left: 0 }}>
        {timeline.time} {timeline.animTime} {timeline.time - Math.floor(timeline.time)}
      </p>
      <Canvas orthographic style={{ width: '100%', height: '100%' }} gl={{ antialias: true }}>
        {loaded ? <NesaUI /> : null}
        {loaded ? <Nesa /> : null}
      </Canvas>

      {lottieDef.map((lottie) => {
        return (
          <Lottie key={lottie.name} scale={lottie.scale} name={lottie.name} json={lottie.json} />
        )
      })}

      <AlignedView align="center" elementName={'Empty_Icon_Name 1'}>
        <p style={{ textAlign: 'center' }}>ENCRYPTION</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 2'}>
        <p style={{ textAlign: 'center' }}>MARKET</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 3'}>
        <p style={{ textAlign: 'center' }}>CONTAINER</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 4'}>
        <p style={{ textAlign: 'center' }}>SHARING</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 5'}>
        <p style={{ textAlign: 'center' }}>COMPUTE</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 6'}>
        <p style={{ textAlign: 'center' }}>CHAIN</p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Icon_Name 7'}>
        <p style={{ textAlign: 'center' }}>ORACLE</p>
      </AlignedView>

      <AlignedView align="left" elementName={'Empty_text 1'}>
        <p style={{ textAlign: 'left' }}>L1</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 2'}>
        <p style={{ textAlign: 'left' }}>NESA LAYER 1</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 3'}>
        <p style={{ textAlign: 'left' }}>SECURE EXECUTION ENVIRONMENT</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 4'}>
        <p style={{ textAlign: 'left' }}>
          As a foundational Layer-1 blockchain, Nesa handles everything from jobs, payments,
          validation, consensus, data availability, transactions and settlemert, all in a secure
          execution environment built to facilitate Al inference and infrastructure.{' '}
        </p>
      </AlignedView>

      <AlignedView align="left" elementName={'Empty_text 1.001'}>
        <p style={{ textAlign: 'left' }}>L2</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 3.001'}>
        <p style={{ textAlign: 'left' }}>AI LINK TM</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 2.001'}>
        <p style={{ textAlign: 'left' }}>POWERED BY NESA</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 4.001'}>
        <p style={{ textAlign: 'left' }}>
          A rich ecosystem of applications and protocols rest on the third layer of Nesa Chain,
          powered by Al inference infrastructure on the Laver - 1.
        </p>
      </AlignedView>

      <AlignedView align="left" elementName={'Empty_text 1.002'}>
        <p style={{ textAlign: 'left' }}>L3</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 3.002'}>
        <p style={{ textAlign: 'left' }}>SPOTLIGHT APPLICATIONS</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 2.002'}>
        <p style={{ textAlign: 'left' }}>SECURE EXECUTION ENVIRONMENT</p>
      </AlignedView>
      <AlignedView align="left" elementName={'Empty_text 4.002'}>
        <p style={{ textAlign: 'left' }}>
          A rich ecosystem of applications and protocols rest on the app layer of Nesa Chain,
          powered by Al inference infrastructure on Layer - 1.
        </p>
      </AlignedView>
      <AlignedView align="center" elementName={'Empty_Application Layer'}>
        <p style={{ textAlign: 'center' }}>APPLICATION LAYER</p>
      </AlignedView>
    </div>
  )
})

Token.displayName = 'Token'

export default Token
